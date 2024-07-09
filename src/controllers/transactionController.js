import app from "../app.js";
import { pool } from "../db.js";

export const renderofferstoverify = async (req, res) => {
  /* const [rows] = await pool.query("SELECT * FROM offertoverify WHERE deleted = ?", ["F"]); */
  // Solamente se renderean aquellas publicaciones que no son las del usuario logeado
  const [idPuerto] = await pool.query("SELECT user.idPuerto FROM user WHERE email = ?", [app.locals.emailCookie]);
  console.log("El puerto es: " + idPuerto[0]);
  let offers = [];
  if (idPuerto) {
    const [publications] = await pool.query("SELECT * FROM publication WHERE idPuerto = ?", [idPuerto[0].idPuerto]);
    const idPublications = [];
    if (publications.length > 0) {
      publications.forEach(item => {
        /* console.log("id foreach: ", item.idPublication); */
        idPublications.push(item.idPublication);
      })
      offers = await pool.query("SELECT idOfferToVerify as idOffer, publication.plate, publication.idPuerto, publication.description as descripcionPublicacion, user.name, vehicle.matricula, vehicle.marca, vehicle.modelo,vehicle.año, vehicle.kilometros, vehicle.description as descripcionVehiculo FROM offertoverify INNER JOIN publication ON offertoverify.idPublication = publication.idPublication INNER JOIN user ON offertoverify.idUser = user.idUser INNER JOIN vehicle ON offertoverify.idVehicle = vehicle.idVehicle WHERE publication.idPublication IN ?", [[idPublications]]);
      offers = offers[0];
      console.log("offers ", offers);
    }
    res.render("offers", { offers: offers, transactions: true });
  }
};

export const acceptTransaction = async (req, res) => {
  const { id } = req.params;
  /*const [offer] = await pool.query("SELECT idUser, idPublication, idVehicle FROM offertoverify WHERE idOfferToVerify = ?", [id]);
  await pool.query("INSERT INTO offertoverify set ?", [offer[0]]);
  await pool.query("UPDATE publication SET deleted = ? WHERE idPublication = ?", ["T", offer[0].idPublication]); */

  await pool.query("INSERT INTO transactionsuccess (`idTransaction`) VALUES (NULL)");

  const [publicacion] = await pool.query("SELECT idPublication,idUser,idVehicle FROM offertoverify WHERE idOfferToVerify = ?", [id]);
  const idVehiculoOfertado = publicacion[0].idVehicle;
  const idPublication = publicacion[0].idPublication;
  const idUserOfertor = publicacion[0].idUser;

  const [matriculaDelVehiculo] = await pool.query("SELECT matricula FROM vehicle WHERE idVehicle = ?", [idVehiculoOfertado]);


  const [PublicacionOriginal] = await pool.query("SELECT idUser,plate FROM publication WHERE idPublication = ?", [idPublication]);
  const idDuenioPublicacion = PublicacionOriginal[0].idUser
  const matriculaPublicacion = PublicacionOriginal[0].plate

  //Creo el mensaje y se los envio al ofertor y al dueño de la publicación
  const message = "Se ha llevado a cabo exitosamente el intercambio de la embarcación de matricula: " + matriculaPublicacion + " con el vehículo de matricula: " + matriculaDelVehiculo[0].matricula;
  await pool.query("INSERT INTO notification set  idUser = ? , description = ?", [idUserOfertor, message]);
  await pool.query("INSERT INTO notification set  idUser = ? , description = ?", [idDuenioPublicacion, message]);


  await pool.query("DELETE FROM offertoverify WHERE idOfferToVerify = ?", [id]);
  res.redirect("/renderofferstoverify");
};

export const denyTransaction = async (req, res) => {
  const { id } = req.params;
  const [offer] = await pool.query("SELECT idUser, idPublication, idVehicle FROM offertoverify WHERE idOfferToVerify = ?", [id]);
  await pool.query("UPDATE publication SET deleted = ? WHERE idPublication = ?", ["F", offer[0].idPublication]);
  await pool.query("DELETE FROM offertoverify WHERE idOfferToVerify = ?", [id]);
  res.redirect("/renderofferstoverify");
};