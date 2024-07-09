import app from "../app.js";
import { pool } from "../db.js";

export const makeOfferPage = async (req, res) => {
  if (app.locals.emailCookie !== "empty@gmail.com") {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM publication WHERE idPublication = ?", [id]);
    res.render("makeOfferPage", { publicacion: id });
  }
  else {
    res.send("Debes estar logueado para realizar una oferta");
  }
};

export const createOffer = async (req, res) => {
  const [rowsUser] = await pool.query("SELECT idUser FROM user WHERE email = ?", [app.locals.emailCookie]);
  const idUser = rowsUser[0].idUser
  //CREO EL VEHICULO LOCALMENTE CON LOS DATOS DEL FORMULARIO MAS EL ID DEL USUARIO
  const vehicleLocal = { idUser: idUser, matricula: req.body.matricula, marca: req.body.marca, modelo: req.body.modelo, año: req.body.ano, kilometros: req.body.kilometros, description: req.body.description };

  //ESTO LO COMENTE POR QUE ES LA VERIFICACION DE SI EL VEHICULO EXISTE QUE NO LO ESTAMOS IMPLEMENTANDO
  /*let [rowsVehicle] = await pool.query("SELECT idVehicle FROM vehicle WHERE matricula = ?", [vehicle.matricula]);
  let idVehicle = rowsVehicle[0]
  console.log("Vehicle:", vehicle)
  if (!idVehicle) {
    await pool.query("INSERT INTO vehicle set ?", [vehicle]);
    rowsVehicle = await pool.query("SELECT idVehicle FROM vehicle WHERE matricula = ?", [vehicle.matricula]);
    idVehicle = rowsVehicle[0][0]
  }*/
  //INSERTO EL VEHICULO EN LA BASE DE DATOS Y ME TRAIGO SU ID PARA PODER CONECTARLO CON LA OFERTA
  await pool.query("INSERT INTO vehicle set ?", [vehicleLocal]);
  const vehicleBD = await pool.query("SELECT idVehicle FROM vehicle WHERE matricula = ?", [vehicleLocal.matricula]);
  console.log("VEHICULO", vehicleBD)
  const idVehicle = vehicleBD[0][0]
  //CREO LA OFERTA Y LA INSERTO CON LOS ID DEL USUARIO, PUBLICACION PASADA POR PARAMETRO Y EL VEHICULO QUE ACABO DE CREAR
  const offer = { idUser: idUser, idPublication: req.params.id, idVehicle: idVehicle.idVehicle };
  await pool.query("INSERT INTO offer set ?", [offer]);

  //Creamos una notificación que será enviada al dueño de la puclicación con la descripción "Ha recibido una oferta"
  //Conseguir el mail del dueño de la publicacion
  const [rowsPublication] = await pool.query("SELECT idUser, plate FROM publication WHERE idPublication = ?", [req.params.id]);
  if (rowsPublication.length > 0) {
    //Crear notificación
    const message = "Ha recibido una nueva oferta en la embarcación: " + rowsPublication[0].plate;
    await pool.query("INSERT INTO notification set  idUser = ? , description = ?", [rowsPublication[0].idUser, message]);
  }


  res.redirect("/");
};

export const renderVehicles = async (req, res) => {
  console.log("HOLA")
  const [rowsUser] = await pool.query("SELECT idUser FROM user WHERE email = ?", [app.locals.emailCookie]);
  console.log("IDUSER: ", rowsUser)
  const idUser = rowsUser[0].idUser
  const [rowsVehicle] = await pool.query("SELECT * FROM vehicle WHERE idUser = ?", [idUser]);
  console.log("vehiculos ", rowsVehicle);
  res.render("vehicles", { vehiculos: rowsVehicle });
};

export const renderOffers = async (req, res) => {
  const [user] = await pool.query("SELECT idUser FROM user WHERE email = ?", [app.locals.emailCookie]);
  let offers = []
  let publications = []
  const idPublications = [];
  if (user[0].idUser != undefined) {
    publications = await pool.query("SELECT publication.idPublication FROM publication WHERE idUser = ?", [user[0].idUser]);
    publications = publications[0]
    console.log("publications ", publications);
    if (publications.length > 0) {
      publications.forEach(id => {
        console.log("id foreach: ", id.idPublication);
        idPublications.push(id.idPublication)
      })
      offers = await pool.query("SELECT idOffer, publication.plate, publication.idPuerto, publication.description as descripcionPublicacion, user.name, vehicle.matricula, vehicle.marca, vehicle.modelo,vehicle.año, vehicle.kilometros, vehicle.description as descripcionVehiculo FROM offer INNER JOIN publication ON offer.idPublication = publication.idPublication INNER JOIN user ON offer.idUser = user.idUser INNER JOIN vehicle ON offer.idVehicle = vehicle.idVehicle WHERE publication.idPublication IN ?", [[idPublications]]);
      offers = offers[0]
    }
    console.log("offers ", offers);
    res.render("offers", { offers: offers, transactions: false });
  }

};

export const acceptOffer = async (req, res) => {
  const { id } = req.params;
  const [offer] = await pool.query("SELECT idUser, idPublication, idVehicle FROM offer WHERE idOffer = ?", [id]);
  await pool.query("INSERT INTO offertoverify set ?", [offer[0]]);
  await pool.query("UPDATE publication SET deleted = ? WHERE idPublication = ?", ["T", offer[0].idPublication]);
  //await pool.query("DELETE FROM offer WHERE  idOffer = ?", [id]);
  await pool.query("DELETE FROM offer WHERE  idPublication = ?", [offer[0].idPublication]); // Eliminar las ofertas restantes de la publicación
  const [rowsPublication] = await pool.query("SELECT idUser, plate FROM publication WHERE idPublication = ?", [offer[0].idPublication]);
  // Buscamos al usuario que hizo la oferta para enviarle la notificación de que su oferta fue aceptada
  const idUserBuyer = offer[0].idUser;
  const message = "Su oferta por la embarcación de matricula: " + rowsPublication[0].plate + "  ha sido aceptada";
  await pool.query("INSERT INTO notification set  idUser = ? , description = ?", [idUserBuyer, message]);

  res.redirect("/renderOfertas");
};

export const denyOffer = async (req, res) => {
  const { id } = req.params;
  const [offer] = await pool.query("SELECT idUser, idPublication, idVehicle FROM offer WHERE idOffer = ?", [id]);

  const [rowsPublication] = await pool.query("SELECT idUser, plate FROM publication WHERE idPublication = ?", [offer[0].idPublication]);
  // Buscamos al usuario que hizo la oferta para enviarle la notificación de que su oferta fue aceptada
  const idUserBuyer = offer[0].idUser;
  const message = "Su oferta por la embarcación de matricula: " + rowsPublication[0].plate + "  ha sido rechazada";
  await pool.query("INSERT INTO notification set  idUser = ? , description = ?", [idUserBuyer, message]);


  await pool.query("DELETE FROM offer WHERE  idOffer = ?", [id]);
  res.redirect("/renderOfertas");
};

