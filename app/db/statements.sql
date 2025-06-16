CREATE TABLE Usuarios (
  ID_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT,
  password TEXT,
  N_departamento TEXT,
  admin INTEGER,
  rut INTEGER,
  nombre TEXT,
  apellido TEXT,
  correo TEXT,
  telefono TEXT,
  reitro_compartido INTEGER
);

CREATE TABLE Paquetes (
  ID_pack INTEGER PRIMARY KEY AUTOINCREMENT,
  ID_userDestinatario INTEGER,
  ID_userRetirador INTEGER,
  fecha_entrega DATETIME,
  fecha_limite DATETIME,
  fecha_retiro DATETIME,
  ubicacion TEXT,
  FOREIGN KEY (ID_userDestinatario) REFERENCES Usuarios(ID_usuario),
  FOREIGN KEY (ID_userRetirador) REFERENCES Usuarios(ID_usuario)
);

CREATE TABLE reclamos (
  ID_reclamo INTEGER PRIMARY KEY AUTOINCREMENT,
  ID_usuario INTEGER,
  ID_pack INTEGER,
  descripción TEXT,
  status TEXT,
  FOREIGN KEY (ID_usuario) REFERENCES Usuarios(ID_usuario),
  FOREIGN KEY (ID_pack) REFERENCES Paquetes(ID_pack)
);

CREATE TABLE Notificaciones (
  ID_notificacion INTEGER PRIMARY KEY AUTOINCREMENT,
  ID_pack INTEGER,
  mensaje TEXT,
  fecha_envio DATETIME,
  leido INTEGER,
  FOREIGN KEY (ID_pack) REFERENCES Paquetes(ID_pack)
);

CREATE TABLE IF NOT EXISTS CodigosQR (
  ID_qr INTEGER PRIMARY KEY AUTOINCREMENT,
  codigo_qr TEXT UNIQUE NOT NULL,
  ID_paquete INTEGER NOT NULL,
  ID_residente INTEGER NOT NULL,
  fecha_generacion TEXT NOT NULL,
  fecha_expiracion TEXT NOT NULL,
  fecha_uso TEXT,
  estado TEXT DEFAULT 'activo' CHECK(estado IN ('activo', 'utilizado', 'expirado')),
  FOREIGN KEY (ID_paquete) REFERENCES Paquetes(ID_pack),
  FOREIGN KEY (ID_residente) REFERENCES Usuarios(ID_usuario)
);

-- insertar valores de prueba
-- usuarios prueba
INSERT INTO Usuarios (ID_usuario, username, password, N_departamento, admin, rut, nombre, apellido, correo, telefono, reitro_compartido)
VALUES
  (1, 'adminuser', 'adminpass', 'Depto A', 1, 12345678, 'Ana', 'Pérez', 'ana@example.com', '987654321', 0),
  (2, 'jdoe', 'password1', 'Depto B', 0, 23456789, 'Juan', 'Doe', 'juan@example.com', '987654322', 1),
  (3, 'mlopez', 'password2', 'Depto A', 0, 34567890, 'María', 'López', 'maria@example.com', '987654323', 0),
  (4, 'csoto', 'password3', 'Depto C', 0, 45678901, 'Carlos', 'Soto', 'carlos@example.com', '987654324', 0);

INSERT INTO Usuarios (ID_usuario, username, password, N_departamento, admin, rut, nombre, apellido, correo, telefono, reitro_compartido)
VALUES
  (5, 'guille', 'password', 'Depto1', 1, 21500000, 'Guillermo', 'González', 'gg@example.com', '993226177', 1)

-- paquetes
INSERT INTO Paquetes (ID_pack, ID_userDestinatario, ID_userRetirador, fecha_entrega, fecha_limite, fecha_retiro, ubicacion)
VALUES
  (1, 2, 2, '2025-04-01 10:00:00', '2025-04-07 18:00:00', '2025-04-02 15:00:00', 'Conserjería A'),
  (2, 3, 3, '2025-04-02 11:00:00', '2025-04-08 18:00:00', NULL, 'Conserjería B'),
  (3, 4, NULL, '2025-04-03 12:00:00', '2025-04-09 18:00:00', NULL, 'Conserjería A'),
  (4, 1, 1, '2025-04-01 13:00:00', '2025-04-06 18:00:00', '2025-04-04 17:00:00', 'Conserjería C');

-- Notificaciones
INSERT INTO Notificaciones (ID_notificacion, ID_pack, mensaje, fecha_envio, leido)
VALUES
  (1, 1, 'Su paquete ha sido entregado.', '2025-04-01 10:10:00', 1),
  (2, 2, 'Su paquete está disponible para retiro.', '2025-04-02 11:05:00', 0),
  (3, 3, 'Nuevo paquete en conserjería.', '2025-04-03 12:10:00', 0),
  (4, 4, 'Paquete retirado con éxito.', '2025-04-04 17:05:00', 1);

-- Reclamos

INSERT INTO reclamos (ID_reclamo, ID_usuario, ID_pack, descripción, status)
VALUES
  (1, 2, 1, 'El paquete llegó con daño en la caja.', 'pendiente'),
  (2, 3, 2, 'El paquete nunca fue entregado.', 'en proceso');

SELECT * FROM NotificacionesWhatsApp

-- Crear tabla para registro de notificaciones WhatsApp
CREATE TABLE IF NOT EXISTS NotificacionesWhatsApp (
  ID_notificacion INTEGER PRIMARY KEY AUTOINCREMENT,
  ID_paquete INTEGER NOT NULL,
  ID_usuario INTEGER NOT NULL,
  mensaje_id TEXT,
  estado TEXT NOT NULL, -- 'template_enviado', 'error_envio', 'respuesta_recibida', 'detalles_enviados'
  fecha_creacion TEXT NOT NULL,
  fecha_actualizacion TEXT,
  FOREIGN KEY (ID_paquete) REFERENCES Paquetes(ID_pack),
  FOREIGN KEY (ID_usuario) REFERENCES Usuarios(ID_usuario)
);
-- borrar todo
-- DROP TABLE IF EXISTS Usuarios;
-- DROP TABLE IF EXISTS Paquetes;
-- DROP TABLE IF EXISTS Notificaciones;
-- DROP TABLE IF EXISTS reclamos;
-- DROP TABLE IF EXISTS NotificacionesWhatsApp;