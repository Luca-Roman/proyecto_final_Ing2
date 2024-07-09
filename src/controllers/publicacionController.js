import { query } from "express";
import app from "../app.js";
import { pool } from "../db.js";

export const createPublicacion = async (req, res) => {
  if (app.locals.emailCookie !== "empty@gmail.com") {
    res.render("createPublication");
  }
};

export const createNewPublicacion = async (req, res) => {
  const newPublication = req.body;
  let [matricula] = await pool.query("SELECT * FROM publication WHERE plate = ?", [newPublication.plate]);
  if (matricula.length == 0) {
    let [matricula] = await pool.query("SELECT * FROM publicationtoverify WHERE plate = ?", [newPublication.plate]);
    if (matricula.length == 0) {
      const [rows] = await pool.query("SELECT * FROM user WHERE email = ?", [app.locals.emailCookie]);
      newPublication.idUser = rows[0].idUser;
      await pool.query("INSERT INTO publicationtoverify set ?", [newPublication]);

      //Crear notificación para el administrador, que le avise que 
      const [admin] = await pool.query("SELECT * FROM user WHERE idPuerto = ?", [newPublication.idPuerto]);
      if (admin.length > 0) {
        //Crear notificación
        const message = "Tiene una nueva publicación para validar con la matricula: " + newPublication.plate;
        await pool.query("INSERT INTO notification set  idUser = ? , description = ?", [admin[0].idUser, message]);
      }


      res.redirect("/");
    } else {
      res.status(500).send("No se puede realizar la publicacion. Matricula ya existente en el sistema");
    }
  } else {
    res.status(500).send("No se puede realizar la publicacion. Matricula ya existente en el sistema");
  }
};

export const verifyPublication = async (req, res) => {
  if (app.locals.emailCookie !== "empty@gmail.com") {
    console.log("verify publications:", req.params)
    const [user] = await pool.query("SELECT * FROM user WHERE email = ?", [app.locals.emailCookie]);
    if (user[0].role === "admin") {
      const idPuerto = user[0].idPuerto;
      const [rows] = await pool.query("SELECT * FROM publicationtoverify WHERE idPuerto = ?", [idPuerto]);
      res.render("renderpublicationtoverify", { publications: rows });
    }
  }
};

export const acceptedPublication = async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query("SELECT * FROM publicationtoverify WHERE idPublicationToVerify = ?", [id]);
  delete rows[0].idPublicationToVerify; // no tocar porque hacemos cagada

  //Enviamos la notificación de que la publicación fue aceptada a su dueño
  const message = "Su publicación con matricula: " + rows[0].plate + " fue publicada exitosamente"
  await pool.query("INSERT INTO notification set  idUser = ? , description = ?", [rows[0].idUser, message]);

  await pool.query("INSERT INTO publication set ?", [rows[0]]);
  await pool.query("DELETE FROM publicationtoverify WHERE idPublicationToVerify = ?", [id]);
  res.redirect("/verifyPublication");
};

export const declinedPublication = async (req, res) => {
  const { id } = req.params;

  const [rows] = await pool.query("SELECT * FROM publicationtoverify WHERE idPublicationToVerify = ?", [id]);
  await pool.query("DELETE FROM publicationtoverify WHERE idPublicationToVerify = ?", [id]);

  const message = "Su publicación con matricula: " + rows[0].plate + " fue rechazada"
  await pool.query("INSERT INTO notification set  idUser = ? , description = ?", [rows[0].idUser, message]);

  res.redirect("/verifyPublication");
};

export const renderPublications = async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM publication WHERE deleted = ?", ["F"]);
  // Solamente se renderean aquellas publicaciones que no son las del usuario logeado
  const [user] = await pool.query("SELECT user.idUser FROM user WHERE email = ?", [app.locals.emailCookie]);

  if (user.length > 0) {
    const [favoritas] = await pool.query("SELECT idPublication FROM favouritepublication WHERE idUser = ?", [user[0].idUser]);
    console.log("ESTAS SON MIS FAVORITAS: " + JSON.stringify(favoritas))
    res.render("publicaciones", { publicaciones: rows, idUser: user[0].idUser, favoritos: favoritas });
  } else {
    res.render("publicaciones", { publicaciones: rows, idUser: -1 });
  }

};

export const deletePublication = async (req, res) => {
  const { id } = req.params;
  console.log("Delete:", req.params)
  await pool.query("DELETE FROM publication WHERE idPublication = ?", [id]);
  res.redirect("/renderPublications");
};

export const renderUserPosts = async (req, res) => { // HU que renderiza las publicaciones de un solo usuario 
  const [user] = await pool.query("SELECT user.idUser FROM user WHERE email = ? ", [app.locals.emailCookie]);
  if (user.length > 0) {
    const [rows] = await pool.query("SELECT * FROM publication p WHERE p.idUser = ? and deleted = ?", [user[0].idUser, "F"]);
    res.render("publicaciones", { publicaciones: rows, verMisPublicaciones: "true" });
  }
  else {
    res.status(500).send('Error en el server');
  }
};

export const editPublication = async (req, res) => {
  try {
    const { id } = req.params;
    const [publicacion] = await pool.query("SELECT * FROM publication WHERE idPublication = ?", [id]);//Busco la publicación con el id recibida por parametro
    if (publicacion.length > 0) {
      const [user] = await pool.query("SELECT * FROM user WHERE idUser = ?", [publicacion[0].idUser]) //Busco el user que publico el post para ver si el que lo quiere editar es el usuario en cuestión

      if ((user.length > 0) && (user[0].email == app.locals.emailCookie)) { // verifico que el user con la sesión iniciada sea el dueño de la publicación
        res.render("editPublication", { publication: publicacion[0] }); // renderizo la vista para editar la publicación
      }
      else {
        res.status(500).send('No podes editar la publicación porque no te pertenece');
      }
    }
    else {
      res.status(500).send('La publicación no existe');
    }
  }
  catch (error) {
    res.status(500).send('Error en el servidor');
  }
};

function changesOccurred(oldPublication, newPublication) {
  return newPublication.plate !== oldPublication.plate ||
    newPublication.description !== oldPublication.description ||
    newPublication.manga !== oldPublication.manga ||
    newPublication.eslora !== oldPublication.eslora;
}
function changePlate(oldPublication, newPublication) {
  return newPublication.plate !== oldPublication.plate;
}
export const saveEditPublication = async (req, res) => {
  try {
    const idOldPublication = req.body.idPublication;
    let [row] = await pool.query("SELECT * FROM offer WHERE idPublication = ?", [idOldPublication]);
    if (row.length > 0) {
      res.status(500).send('No se puede modificar la publicacion porque posee ofertas asociadas');
      return;
    }
    let newPublication = req.body;  // Datos recuperados del formulario con los datos a cambiar
    const [oldPublication] = await pool.query("SELECT * FROM publication p WHERE p.idPublication = ?", [idOldPublication]); // Busco la publicación que se quiere modificar para verificar que los datos cambien.
    const olderPublication = oldPublication[0]; // Guardo en olderPublication la publicación aun sin modificar
    newPublication.plate = newPublication.plate || olderPublication.plate; // Si newPublication tiene null o vacio se le asigna el antiguo valor.

    //Actualizo todos los campos de newPublication
    newPublication.description = newPublication.description || olderPublication.description;
    newPublication.manga = newPublication.manga || olderPublication.manga;
    newPublication.eslora = newPublication.eslora || olderPublication.eslora;
    newPublication.idUser = olderPublication.idUser;
    newPublication.idPuerto = olderPublication.idPuerto;

    if (changesOccurred(olderPublication, newPublication)) { //Si ocurrió algún cambio, se manda a revisar.
      if (changePlate(olderPublication, newPublication)) {  //Si cambió la matricula
        let [matricula] = await pool.query("SELECT * FROM publication WHERE plate = ?", [newPublication.plate]); // verifico que no este en la tabla de publicaciones
        if (matricula.length === 0) {
          [matricula] = await pool.query("SELECT * FROM publicationtoverify WHERE plate = ?", [newPublication.plate]); // verifico que no este en la tabla de toVerify
          if (matricula.length > 0) {
            res.status(500).send('La embarcación con la matricula dada ya se encuentra en el sistema')
            return;
          }
        }
        else {
          res.status(500).send('La embarcación con la matricula dada ya se encuentra en el sistema')
          return;
        }
      }

      await pool.query("DELETE FROM publication WHERE  idPublication = ?", [idOldPublication]); // saco la publicación de la lista de publicaciones



      await pool.query("INSERT INTO publicationtoverify (description, manga, eslora, idUser, idPuerto, plate) VALUES( ?, ?, ?, ?, ?, ?)",
        [newPublication.description, newPublication.manga, newPublication.eslora, newPublication.idUser, newPublication.idPuerto, newPublication.plate]);

      res.redirect("/");
      return;
    }
    res.redirect("/");
  }
  catch (error) {
    res.status(500).send('Error en el servidor');
  }
};


export const searchPublication = async (req, res) => {
  const searchInput = "%" + req.body.description.trim() + "%";

  const [rows] = await pool.query("SELECT * FROM publication WHERE description like ? ", [searchInput]);

  const [user] = await pool.query("SELECT user.idUser FROM user WHERE email = ?", [app.locals.emailCookie]);
  if (user.length > 0) {
    res.render("publicaciones", { publicaciones: rows, idUser: user[0].idUser });
  } else {
    res.render("publicaciones", { publicaciones: rows, idUser: -1 });
  }

}

export const filterPublications = async (req, res) => {
  const rangos = req.body;
  //Guardo los rangos uno por uno
  //Rango manga
  const MinManga = rangos.minimoManga ? rangos.minimoManga : 0;
  const MaxManga = rangos.maximoManga ? rangos.maximoManga : 1000;

  //Rango manga
  const MinEslora = rangos.minimoEslora ? rangos.minimoEslora : 0;
  const MaxEslora = rangos.maximoEslora ? rangos.minimoEslora : 1000;


  //Rango Numero de puerto
  const MinNumPuerto = rangos.minimoPuerto ? rangos.minimoPuerto : 0;
  const MaxNumPuerto = rangos.maximoPuerto ? rangos.maximoPuerto : 10;


  // Consulta que devuelve las publicaciones filtradas
  const [rows] = await pool.query(
    "SELECT * FROM publication WHERE (eslora >= ? AND eslora <= ?) AND (manga >= ? AND manga <= ?) AND (idPuerto >= ? AND idPuerto <= ?) AND deleted = ?",
    [MinEslora, MaxEslora, MinManga, MaxManga, MinNumPuerto, MaxNumPuerto, "F"]
  );

  const [user] = await pool.query("SELECT user.idUser FROM user WHERE email = ?", [app.locals.emailCookie]);
  if (user.length > 0) {
    res.render("publicaciones", { publicaciones: rows, idUser: user[0].idUser });
  } else {
    res.render("publicaciones", { publicaciones: rows, idUser: -1 });
  }

}

export const orderPublications = async (req, res) => {
  const orden = req.body.ordenamiento; //manga, eslora o puerto
  const tipo = req.body.tipoDeOrden; // asc , des
  console.log(orden, tipo)

  const query = `SELECT * FROM publication WHERE deleted = ? ORDER BY ${orden} ${tipo}`;
  const [rows] = await pool.query(query, ["F"]);
  const [user] = await pool.query("SELECT user.idUser FROM user WHERE email = ?", [app.locals.emailCookie]);
  if (user.length > 0) {
    res.render("publicaciones", { publicaciones: rows, idUser: user[0].idUser });
  } else {
    res.render("publicaciones", { publicaciones: rows, idUser: -1 });
  }

};

export const renderFavourite = async (req, res) => {

  // Obtén el idUser basado en el emailCookie
  const [user] = await pool.query("SELECT user.idUser FROM user WHERE email = ?", [app.locals.emailCookie]);

  // Obtén los idPublication favoritos del usuario
  if (user.length > 0) {
    const [idsFavoritas] = await pool.query("SELECT idPublication FROM favouritepublication WHERE idUser = ?", [user[0].idUser]);

    // Convierte los idPublication favoritos en un array de IDs
    const favoriteIds = idsFavoritas.map(fav => fav.idPublication);

    // Verifica si hay favoritos y obtiene las publicaciones que no están eliminadas
    let publications = [];
    if (favoriteIds.length > 0) {
      const placeholders = favoriteIds.map(() => '?').join(',');
      publications = await pool.query(`SELECT * FROM publication WHERE idPublication IN (${placeholders}) AND deleted = ?`, [...favoriteIds, "F"]);
      publications = publications[0]
    }


    // Ahora publications contiene las publicaciones favoritas que no están eliminadas

    if (user.length > 0) {
      res.render("publicaciones", { publicaciones: publications, idUser: user[0].idUser });
    } else {
      res.render("publicaciones", { publicaciones: publications, idUser: -1 });
    }
  }
};






