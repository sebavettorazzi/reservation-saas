import express from "express";
import dotenv from "dotenv";
import availabilityRoutes from "./routes/availability";
import appointmentRoutes from "./routes/appointment";
import serviceRoutes from "./routes/service";
import staffRoutes from "./routes/staff";
import customerRoutes from "./routes/customer";

dotenv.config();

const app = express();
app.use(express.json());

app.use("/appointments", appointmentRoutes);
app.use("/services", serviceRoutes);
app.use("/staff", staffRoutes);
app.use("/customers", customerRoutes);
app.use("/availability", availabilityRoutes);

// **NO arrancar el servidor aquí**
// app.listen(PORT, ... ) → se hará en index.ts

export default app;