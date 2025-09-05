import dotenv from "dotenv";
dotenv.config();

import { app } from "./setup/app";

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});


