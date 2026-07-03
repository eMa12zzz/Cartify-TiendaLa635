const logoutController = {};

logoutController.logout = async (req, res) => {
  //Limpiar la cookie que tiene la información
  //de quien inició sesión
  res.clearCookie("authCookie");

  return res.status(200).json({ message: "Sesión cerrada" });
};

export default logoutController;
