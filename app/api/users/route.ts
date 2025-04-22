import { getAllUsers } from "../../db/statements.ts";
console.log("pre función")
export async function GET(request: Request) {
  try {
    console.log("Conectando a la base de datos")
    const users = await getAllUsers();
    console.log("API recibió data")
    console.log(users)
    // En lugar de NextResponse, usamos Response nativa
    const respuesta = new Response(JSON.stringify(users), {
      headers: {
        "Content-Type": "application/json",
      },
      status: 200,
    });
    console.log("respuesta:")
    console.log(respuesta)
    return respuesta
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    
    // Manejo de error con Response nativa
    return new Response(JSON.stringify({ error: "Error al obtener datos de usuarios" }), {
      headers: {
        "Content-Type": "application/json",
      },
      status: 500,
    });
  }
}
