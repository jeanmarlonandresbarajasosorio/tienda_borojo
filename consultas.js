//use tienda_borojo

// ### Inserción
// 1. Insertar un nuevo producto llamado `"Chocolatina de borojó"`, categoría `"Snack"`, con precio `4000`, stock `35`, y tags `["dulce", "energía"]`.
db.productos.insertOne({
  _id: 11,
  nombre: "Chocolatina de borojó",
  categoria: "Snack",
  precio: 4000,
  stock: 35,
  tags: ["dulce", "energía"]
});
// 2. Insertar un nuevo cliente que se llama `"Mario Mendoza"`, con correo `"mario@email.com"`, sin compras, y preferencias `"energético"` y `"natural"`.
db.clientes.insertOne({
  _id: 11,
  nombre: "Mario Mendoza",
  email: "mario@email.com",
  compras: [],
  preferencias: ["energético", "natural"]
});
// ### Lectura
// 1. Consultar todos los productos que tengan stock mayor a 20 unidades.
db.productos.find({ stock: { $gt: 20 } },{ nombre: 1, _id: 0 })
// 2. Encontrar los clientes que no han comprado aún ningún producto.
db.clientes.find({ compras: { $size: 0 } },{ nombre: 1, _id: 0 })
// ### Actualización
// 1. Aumentar en 10 unidades el stock del producto `"Borojó deshidratado"`.
db.productos.updateOne({nombre:"Borojó deshidratado"},{$inc:{stock:10}})
// 2. Añadir el tag `"bajo azúcar"` a todos los productos de la categoría `"Bebida"`.
db.productos.updateMany({categoria:"Bebida"},{$push:{ tags: "bajo azúcar" }})
// ### Eliminación
// 1. Eliminar el cliente que tenga el correo `"juan@email.com"`.
db.clientes.deleteOne({ email: "juan@email.com" });
// 2. Eliminar todos los productos con stock menor a 5 (considera esto como un proceso de limpieza de inventario).
db.productos.deleteMany({ stock: { $lt: 5 } });
// ### Consultas con Expresiones Regulares
// 1. Buscar productos cuyo nombre **empiece** por `"Boro"`.
db.productos.find({ nombre: { $regex: "^Boro", $options: "i" } });
// 2. Encontrar productos cuyo nombre contenga la palabra `"con"` (como en “Concentrado de borojó”).
db.productos.find({ nombre: { $regex: "con", $options: "i" } });
// 3. Encontrar clientes cuyo nombre tenga la letra `"z"` (insensible a mayúsculas/minúsculas).
db.clientes.find({ nombre: { $regex: "z", $options: "i" } });
// ### Operadores en consultas sobre arrays
// 1. Buscar clientes que tengan `"natural"` en sus preferencias.
db.clientes.find({ preferencias: "natural" });
// 2. Encontrar productos que tengan al menos los tags `"natural"` y `"orgánico"` (usa `$all`).
db.productos.find({ tags: { $all: ["natural", "orgánico"] } });
// 3. Listar productos que tienen **más de un tag** (`$size`).
db.productos.find({tags:{$not:{$size:1}}})
// ### Aggregation Framework con Pipelines
// 1. Mostrar un listado de los productos más vendidos (suma total de unidades vendidas por producto).
db.ventas.aggregate([
  { $unwind: "$productos" },
  { $group: {
    _id: "$productos.productoId",
    totalUnidades: { $sum: "$productos.cantidad" }
  }},
  { $sort: { totalUnidades: -1 } }
]);
// 2. Agrupar clientes por cantidad de compras realizadas.
db.clientes.aggregate([
  { $project: { nombre: 1, totalCompras: { $size: "$compras" } } },
  { $sort: { totalCompras: -1 } }
]);
// 3. Mostrar el total de ventas por mes (usa `$group` y `$month`).
db.ventas.aggregate([
  { $group: {
    _id: { mes: { $month: "$fecha" } },
    totalVentas: { $sum: "$total" }
  }}
]);
// 4. Calcular el promedio de precios por categoría de producto.
db.productos.aggregate([
  { $group: {
    _id: "$categoria",
    precioPromedio: { $avg: "$precio" }
  }}
]);
// 5. Mostrar los 3 productos con mayor stock (orden descendente con `$sort` y `$limit`).
db.productos.aggregate([
  { $sort: { stock: -1 } },
  { $limit: 3 }
]);
// ### Funciones definidas en `system.js`
// 1. Definir una función `calcularDescuento(precio, porcentaje)` que devuelva el precio con descuento aplicado.
db.system.js.insertOne({
  _id: "calcularDescuento",
  value: new Code("function(precio, porcentaje) { return precio - (precio * (porcentaje / 100)); }")
});

const f1 = db.system.js.findOne({ _id: "calcularDescuento" });
const calcularDescuento = new Function('return ' + f1.value.code)();
print(calcularDescuento(10000, 20)); // 8000

// 2. Definir una función `clienteActivo(idCliente)` que devuelva `true` si el cliente tiene más de 3 compras registradas.
db.system.js.insertOne({
  _id: "clienteActivo",
  value: new Code("function(idCliente) { const cliente = db.clientes.findOne({ _id: idCliente }); return cliente && cliente.compras.length > 3; }")
});

const f2 = db.system.js.findOne({ _id: "clienteActivo" });
const clienteActivo = new Function('return ' + f2.value.code)();
clienteActivo(6); // true 


// 3. Definir una función `verificarStock(productoId, cantidadDeseada)` que retorne si hay suficiente stock.
db.system.js.insertOne({
  _id: "verificarStock",
  value: new Code("function(productoId, cantidadDeseada) { const producto = db.productos.findOne({ _id: productoId }); return producto && producto.stock >= cantidadDeseada; }")
});

const f3 = db.system.js.findOne({ _id: "verificarStock" });
const verificarStock = new Function('return ' + f3.value.code)();
verificarStock(1, 5); // true

// ### Transacciones
// 1. Simular una venta:
//     a. Descontar del stock del producto
//     b. Insertar la venta en la colección `ventas` 
//     Todo dentro de una transacción.
session = db.getMongo().startSession();
const dbSession = session.getDatabase("tienda_borojo");
session.startTransaction();

try {
  // a. Descontar del stock del producto
  dbSession.productos.updateOne(
    { _id: 1 },
    { $inc: { stock: -1 } }
  );
  // b. Insertar la venta en la colección `ventas`
  dbSession.ventas.insertOne({
    _id:11,
    clienteId: 1,
    productos: [{ productoId: 1, cantidad: 1 }],
    fecha: new Date(),
    total: 5000
  });
  session.commitTransaction();
} catch (error) {
  session.abortTransaction();
  print("Error en la transacción:", error);
} finally {
  session.endSession();
}
// 2. Simular la entrada de nuevo inventario:
//     a. Insertar un documento en `inventario` 
//     b. Aumentar el stock del producto correspondiente
//     Todo dentro de una transacción.
session2 = db.getMongo().startSession();
const dbSession2 = session2.getDatabase("tienda_borojo");
session2.startTransaction();

try{
// a. Insertar un documento en `inventario` 
  dbSession2.inventario.insertOne({
    _id: 11,
    productoId: 11,
    lote: "L0011",
    cantidad: 50,
    entrada: new Date()
  });
// b. Aumentar el stock del producto correspondiente
  dbSession2.productos.updateOne({ _id: 11 },
    { $inc: { stock: 50 } }
  );
  session2.commitTransaction();
} catch (error) {
  session2.abortTransaction();
  print("Error en la transacción:", error);
}finally {
  session2.endSession();
}
    
// 3. Hacer una operación de devolución:
//     a. Aumentar el stock del producto
//     b. Eliminar la venta correspondiente
session3 = db.getMongo().startSession();
const dbSession3 = session3.getDatabase("tienda_borojo");
session3.startTransaction();

try {
  // a. Aumentar el stock del producto
  dbSession3.productos.updateOne(
    { _id: 1 },
    { $inc: { stock: 1 } }
  );
  // b. Eliminar la venta correspondiente
  dbSession3.ventas.deleteOne({ _id: 11 });
  session3.commitTransaction();
} catch (error) {
  session3.abortTransaction();
  print("Error en la transacción:", error);
} finally {
  session3.endSession();
}

// ---

// ### Indexación

// 1. Crear un índice en el campo `nombre` de `productos` para mejorar búsquedas por nombre.
db.productos.createIndex({nombre:1})
db.productos.getIndexes()
[
  { v: 2, key: { _id: 1 }, name: '_id_' },
  { v: 2, key: { nombre: 1 }, name: 'nombre_1' }
]
// 2. Crear un índice compuesto sobre `categoria` y `precio` para facilitar búsquedas filtradas por ambas condiciones.
db.productos.createIndex({ categoria: 1, precio: 1 });
db.productos.getIndexes()
[
  { v: 2, key: { _id: 1 }, name: '_id_' },
  {
    v: 2,
    key: { categoria: 1, precio: 1 },
    name: 'categoria_1_precio_1'
  }
]
// 3. Crear un índice en el campo `email` de `clientes` para validaciones rápidas de duplicados.
db.clientes.createIndex({ email: 1 }, { unique: true });
db.clientes.getIndexes()
[
  { v: 2, key: { _id: 1 }, name: '_id_' },
  { v: 2, key: { email: 1 }, name: 'email_1', unique: true }
]
// 4. Usar `explain()` en una consulta para mostrar si el índice de `nombre` está siendo utilizado.
db.productos.find({ nombre: "Borojó fresco" }).explain("executionStats");



