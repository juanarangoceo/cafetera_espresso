import { initBotId } from "botid/client/core";

// La creación de pedidos es contraentrega: un pedido falso se traduce en un
// despacho físico y un flete real. Las server actions se envían por POST a la
// ruta de la página que las invoca, y todo el checkout —formulario, chat y
// asistente de voz— vive en la landing.
initBotId({
  protect: [
    {
      path: "/",
      method: "POST",
    },
  ],
});
