import app from "../app.js";
import { pool } from "../db.js";
import { differenceInYears } from "date-fns";
/* const nodeMailer = require('nodemailer'); */
import nodemailer from 'nodemailer';
export const renderHomePage = async (req, res) => {
  res.render("home");
};

function calcularEdad(nacimiento) {
  var fechaActual = new Date();
  const edad = differenceInYears(fechaActual, nacimiento);
  return edad;
}
export const createUser = async (req, res) => {
  res.render("createUser");
};

function calcularCantidadDeMinusculas(password) {
  var cantMin = password.match(/[a-z]/g);
  var cant = cantMin == null ? 0 : cantMin.length;
  return cant;
}

function calcularCantidadDeMayusculas(password) {
  var cantMay = password.match(/[A-Z]/g);
  var cant = cantMay == null ? 0 : cantMay.length;
  return cant;
}

export const createNewUser = async (req, res) => {
  const newUser = req.body;
  const email = req.body.email;

  const ageInYears = calcularEdad(newUser.birthdate);
  const [existingUser] = await pool.query("SELECT 1 FROM user WHERE email = ?", email);
  const cantMayusculas = calcularCantidadDeMayusculas(req.body.password);
  const cantMinusculas = calcularCantidadDeMinusculas(req.body.password);

  if (existingUser.length > 0) {
    res.send("El mail ya se encuentra registrado en el sistema");
  } else if (ageInYears < 18) {
    res.send("No se puede crear la cuenta. El usuario es menor de edad");
  } else if (req.body.password.length < 8 || cantMayusculas < 1 || cantMinusculas < 1) {
    res.send("La contraseña no cumple con los requisitos impuestos");
  } else {
    await pool.query("INSERT INTO user set ?", [newUser]);
    res.redirect("/");
  }
};

export const loginUser = async (req, res) => {
  res.render("loginUser");
};

/* export const loginEnterUser = async (req, res) => {  
  console.log(req.body);
  const { email, password } = req.body;      
 
  const [rows] = await pool.query("SELECT * FROM user WHERE email = ?", [email]);

  if (rows.length === 0) {
    return res.status(401).send("Invalid email or password");
  }

  const user = rows[0];
  console.log(user);
  if (user.password === password) {    
    app.locals.emailCookie = user.email;
    app.locals.roleCookie = user.role;
    res.redirect("/");
  } else {          
    res.send("Invalid email or password");
  }  
}; */

export const loginEnterUser = async (req, res) => {
  console.log(req.body);
  const { email, password } = req.body;

  const [rows] = await pool.query("SELECT * FROM user WHERE email = ?", [email]);

  if (rows.length === 0) {
    return res.status(401).send("El email ingresado es invalido");
  } else {
    const user = rows[0];
    if (user.password === password) {
      app.locals.emailCookie = user.email;
      app.locals.roleCookie = user.role;
      res.redirect("/");
    } else {
      res.send("La contraseña ingresada es invalida");
    }
  }
};

export const renderUsers = async (req, res) => {
  const user = "user";
  const [rows] = await pool.query("SELECT * FROM user WHERE role = ?", [user]);
  res.render("renderUsers", { users: rows });
};

export const profilePage = async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM user WHERE email = ?", [app.locals.emailCookie]);
  console.log(rows[0]);
  res.render("profile", { user: rows[0] });
};

export const editProfile = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM user WHERE email = ?", [app.locals.emailCookie]);
    if (rows.length > 0) {
      res.render("editProfile", { user: rows[0] });
    }
  }
  catch (error) {
    console.error(error);
    res.status(500).send('Error en el servidor');
  }
};

/*export const saveEditProfile = async (req, res) => {
  const newUser = req.body;
  const [Usuario] = await pool.query("SELECT * FROM user WHERE email = ?", [app.locals.emailCookie]);
  const antiguoUser = Usuario[0];
  try {
    if (newUser != null) {
      newUser.name = newUser.name || antiguoUser.name;
      newUser.lastName = newUser.lastName || antiguoUser.lastName;
      newUser.email = newUser.email || antiguoUser.email;
      const [rows] = await pool.query("SELECT user.email FROM user WHERE user.email = ? AND user.email != ?", [newUser.email, antiguoUser.email]);
      if (rows.length === 0) { //Cambios: Antes la condición era que si el mail ya estaba registrado tirara error, pero seguia con los chequeos, ahora la condicion es que si no se encuentra registrado siga con los chequeos y en caso contrario que tire el error y finalize.
        newUser.locality = newUser.locality || antiguoUser.locality;
        newUser.birthdate = newUser.birthdate || antiguoUser.birthdate;
        const ageInYears = calcularEdad(newUser.birthdate);
        if (ageInYears < 18) {
          res.status(500).send('La edad es menor a 18 años');
        }
        else {
          newUser.dni = newUser.dni || antiguoUser.dni;
          newUser.phoneNumber = newUser.phoneNumber || antiguoUser.phoneNumber;
          console.log(antiguoUser);
          console.log(newUser);
          await pool.query("UPDATE user SET ? WHERE email = ?", [newUser, app.locals.emailCookie]);
          res.render("profile", { user: newUser });
        }
      } else {
        res.status(500).send('El mail ingresado ya se encuentra registrado con otra cuenta');
      }
    }
  }
  catch (error) {
    console.error(error);
    res.status(500).send('Error en el servidor');
  }
};*/

export const saveEditProfile = async (req, res) => {
  const newUser = req.body;
  const [Usuario] = await pool.query("SELECT * FROM user WHERE email = ?", [app.locals.emailCookie]);
  const antiguoUser = Usuario[0];
  try {
    if (newUser != null) {
      newUser.name = newUser.name || antiguoUser.name;
      newUser.lastName = newUser.lastName || antiguoUser.lastName;
      newUser.email = newUser.email || antiguoUser.email;
      const [rows] = await pool.query("SELECT user.email FROM user WHERE user.email = ? AND user.email != ?", [newUser.email, antiguoUser.email]);
      if (rows.length === 0) { //Cambios: Antes la condición era que si el mail ya estaba registrado tirara error, pero seguia con los chequeos, ahora la condicion es que si no se encuentra registrado siga con los chequeos y en caso contrario que tire el error y finalize.
        newUser.locality = newUser.locality || antiguoUser.locality;
        newUser.birthdate = newUser.birthdate || antiguoUser.birthdate;
        const ageInYears = calcularEdad(newUser.birthdate);
        if (ageInYears < 18) {
          res.status(500).send('La edad es menor a 18 años');
        }
        else {
          newUser.dni = newUser.dni || antiguoUser.dni;
          newUser.phoneNumber = newUser.phoneNumber || antiguoUser.phoneNumber;
          console.log(antiguoUser);
          console.log(newUser);
          await pool.query("UPDATE user SET ? WHERE email = ?", [newUser, app.locals.emailCookie]);
          res.render("profile", { user: newUser });
        }
      } else {
        res.status(500).send('El mail ingresado ya se encuentra registrado con otra cuenta');
      }
    }
  }
  catch (error) {
    console.error(error);
    res.status(500).send('Error en el servidor');
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  console.log(id);
  let [rows] = await pool.query("SELECT * FROM publication WHERE idUser = ?", [id]);
  if (rows.length == 0) {
    [rows] = await pool.query("SELECT * FROM publicationtoverify WHERE idUser = ?", [id]);
    if (rows.length == 0) {
      await pool.query("DELETE FROM user WHERE idUser = ?", [id]);
      await pool.query("DELETE FROM offer WHERE idUser = ?", [id]);
      res.redirect("/renderUsers");
    } else {
      res.status(500).send('No se puede borrar el usuario porque tiene publicaciones a validar');
    }
  } else {
    res.status(500).send('No se puede borrar el usuario porque tiene publicaciones existentes');
  }
};

export const logoutUser = async (req, res) => {
  app.locals.emailCookie = "empty@gmail.com";
  app.locals.roleCookie = "";
  res.redirect("/");
};

export const changePassword = async (req, res) => {
  res.render("changePassword");
};

export const changeNewPassword = async (req, res) => {
  console.log(req.body);
  const { password1, password2 } = req.body;

  if (password1 === password2) {
    const cantMayusculas = calcularCantidadDeMayusculas(password1);
    const cantMinusculas = calcularCantidadDeMinusculas(password1);
    if (password1.length >= 8 && cantMayusculas > 0 && cantMinusculas > 0) {
      await pool.query("UPDATE user SET password = ? WHERE email = ?", [password1, app.locals.emailCookie]);
      res.redirect("/profile");

    } else {
      return res.status(400).send("La nueva contraseña no cumple con los requisitos");
    }
  } else {
    return res.status(400).send("Las contraseñas no coinciden");
  }
};

export const forgotPassword = async (req, res) => {
  res.render("forgotPassword");
};

function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }
  return result;
}

export const forgotPassword2 = async (req, res) => {
  const email = req.body.email;
  const newPassword = generateRandomString(10);
  await pool.query("UPDATE user SET password = ? WHERE email = ?", [newPassword, email]);

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "pearsolutionsar@gmail.com",
      pass: "lltffkwfsyocccwx"
    }
  })

  let mail = {
    from: "pearsolutionsar@gmail.com",
    to: email,
    subject: "Recuperacion de contraseña olvidada",
    text: "Su nueva contraseña es: " + newPassword
  };

  transporter.sendMail(mail, (error, info) => {
    if (error) {
      console.error("Error sending email: ", error);
    }//end if
    else {
      console.log("Email sent.");
    }//end else
  });

  res.redirect("/");
};

export const deleteAccount = async (req, res) => {
  let [rows] = await pool.query("SELECT * FROM user WHERE email = ?", [app.locals.emailCookie]);
  if (rows.length != 0) {
    const id = rows[0].idUser;
    rows = await pool.query("SELECT idPublication FROM publication WHERE idUser = ?", [id]);
    /* [rows] = await pool.query("SELECT idPublication FROM publication WHERE idUser = ? and deleted = ?", [id, "F"]);   */
    if (rows.length == 0) {
      res.render("deleteAccount");
      /* const [rows2] = await pool.query("SELECT idPublication FROM publication WHERE idUser = ? and deleted = ?", [id, "T"]);   */
      /*  else {
          const [rows2] = await pool.query("SELECT idPublication FROM offertoverify WHERE idUser = ? and deleted = ?", [id, "T"]); 
      }   */
    } else {
      res.render("errorPage", { errorMessage: "No puede eliminar su cuenta porque tiene publicaciones activas" });
    }
  }
};

export const deleteAccount2 = async (req, res) => {
  let [rows] = await pool.query("SELECT * FROM user WHERE email = ?", [app.locals.emailCookie]);
  const id = rows[0].idUser;
  await pool.query("DELETE FROM user WHERE email = ?", [app.locals.emailCookie]);
  app.locals.emailCookie = "empty@gmail.com";
  app.locals.roleCookie = "";
  await pool.query("DELETE FROM offer WHERE idUser = ?", [id]);
  await pool.query("DELETE FROM publicationtoverify WHERE idUser = ?", [id]);
  res.redirect("/");
};

export const renderEstadistics = async (req, res) => {
  //Calculo de usuarios totales
  const [totalUsers] = await pool.query("SELECT COUNT(*) as users FROM user WHERE role = ? ", ["user"]);


  // Calculo de publicaciones 
  const [totalPublications] = await pool.query("SELECT COUNT(*) as p FROM publication WHERE deleted = ? ", ["F"]);

  // Calculo de ofertas totales
  const [totalOffers] = await pool.query("SELECT COUNT(*) as offers  FROM offer ");


  // Calculo de intercambios realizados
  const [totalTransactions] = await pool.query("SELECT COUNT(*) as t FROM transactionsuccess ");

  res.render("estadisticsUsers", { ofertas: totalOffers[0].offers, publicaciones: totalPublications[0].p, users: totalUsers[0].users, intercambios: totalTransactions[0].t });
};