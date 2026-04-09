import { Router } from "express";
const router = Router();

// Ejemplo de endpoint GET
router.get("/", async (req, res) => {
  res.send("Lista de clientes aún no implementada");
});

export default router;