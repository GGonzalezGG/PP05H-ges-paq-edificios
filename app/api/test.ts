import { getAllUsers } from "../db/statements.ts";

try {
  const users = getAllUsers();
  console.log("Usuarios:", users);
} catch (error) {
  console.error("Error:", error.message);
}