/**
 * Matriz de validaciones del cliente.
 *
 * Convención: las funciones primitivas devuelven `null` cuando el valor es válido
 * o un mensaje de error en español cuando no lo es. Las funciones compuestas
 * devuelven `{ valido, errores }`, donde `errores` es un objeto indexado por campo.
 */

export const RUC_REGEX = /^(10|20)\d{9}$/;
export const DNI_REGEX = /^\d{8}$/;
export const CORREO_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const TELEFONO_REGEX = /^[0-9+\s-]{6,15}$/;
export const PLACA_REGEX = /^([A-Z]{3}-\d{3}|[A-Z]{2}-\d{4}|[A-Z]\d[A-Z]-\d{3})$/;
export const HORA_REGEX = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;
export const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const PASSWORD_MIN_LENGTH = 8;

const ROLES_VALIDOS = ["ADMIN", "EMPLEADO"];

/** Indica si un valor está vacío (null, undefined o cadena en blanco). */
export function esVacio(valor) {
  if (valor === null || valor === undefined) return true;
  if (typeof valor === "string") return valor.trim() === "";
  return false;
}

/** Campo obligatorio genérico. */
export function validarRequerido(valor, mensaje = "Este campo es obligatorio.") {
  return esVacio(valor) ? mensaje : null;
}

/** RUC peruano: 11 dígitos con prefijo 10 o 20. */
export function validarRuc(valor) {
  if (esVacio(valor)) return "El RUC es obligatorio.";
  const ruc = String(valor).trim();
  if (!/^\d+$/.test(ruc)) return "El RUC solo debe contener dígitos.";
  if (!RUC_REGEX.test(ruc)) {
    return "El RUC debe tener 11 dígitos y comenzar con 10 o 20.";
  }
  return null;
}

/** DNI peruano: exactamente 8 dígitos. */
export function validarDni(valor) {
  if (esVacio(valor)) return "El DNI es obligatorio.";
  const dni = String(valor).trim();
  if (!DNI_REGEX.test(dni)) return "El DNI debe tener exactamente 8 dígitos.";
  return null;
}

/** Correo electrónico con formato válido. */
export function validarCorreo(valor) {
  if (esVacio(valor)) return "El correo es obligatorio.";
  if (!CORREO_REGEX.test(String(valor).trim())) return "Ingresa un correo válido.";
  return null;
}

/**
 * Normaliza una placa peruana a mayúsculas y con guion.
 * Acepta ABC-123, AB-1234 y A1B-234 (con o sin guion al escribir).
 */
export function normalizarPlaca(valor) {
  const compacto = String(valor ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  if (/^[A-Z]{3}\d{3}$/.test(compacto)) {
    return `${compacto.slice(0, 3)}-${compacto.slice(3)}`;
  }
  if (/^[A-Z]{2}\d{4}$/.test(compacto)) {
    return `${compacto.slice(0, 2)}-${compacto.slice(2)}`;
  }
  if (/^[A-Z]\d[A-Z]\d{3}$/.test(compacto)) {
    return `${compacto.slice(0, 3)}-${compacto.slice(3)}`;
  }
  return compacto;
}

/** Placa vehicular peruana válida. */
export function validarPlaca(valor) {
  if (esVacio(valor)) return "La placa es obligatoria.";
  const placa = normalizarPlaca(valor);
  if (!PLACA_REGEX.test(placa)) {
    return "Ingresa una placa válida (ej. ABC-123).";
  }
  return null;
}

/** Peso de residuo: numérico, mayor a 0 y con máximo 2 decimales. */
export function validarPeso(valor) {
  if (esVacio(valor)) return "El peso es obligatorio.";
  const texto = String(valor).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(texto)) {
    return "El peso debe ser un número con máximo 2 decimales.";
  }
  const numero = Number(texto);
  if (!Number.isFinite(numero) || numero <= 0) {
    return "El peso debe ser mayor a 0.";
  }
  return null;
}

/** Capacidad de vehículo: numérica y mayor a 0. */
export function validarCapacidad(valor) {
  if (esVacio(valor)) return "La capacidad es obligatoria.";
  const texto = String(valor).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(texto)) {
    return "La capacidad debe ser un número con máximo 2 decimales.";
  }
  const numero = Number(texto);
  if (!Number.isFinite(numero) || numero <= 0) {
    return "La capacidad debe ser mayor a 0.";
  }
  return null;
}

/** Contraseña con la longitud mínima exigida por el backend. */
export function validarPassword(valor) {
  if (esVacio(valor)) return "La contraseña es obligatoria.";
  if (String(valor).length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  return null;
}

/** Teléfono opcional con 6 a 15 caracteres permitidos. */
export function validarTelefono(valor) {
  if (esVacio(valor)) return null;
  if (!TELEFONO_REGEX.test(String(valor).trim())) {
    return "Ingresa un teléfono válido (6 a 15 caracteres).";
  }
  return null;
}

/** Fecha en formato AAAA-MM-DD. */
export function validarFecha(valor) {
  if (esVacio(valor)) return "Selecciona la fecha.";
  const fecha = String(valor).trim();
  if (!FECHA_REGEX.test(fecha)) return "Usa el formato AAAA-MM-DD.";
  const comprobacion = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(comprobacion.getTime())) return "La fecha no es válida.";
  return null;
}

/** Hora en formato HH:mm o HH:mm:ss. */
export function validarHora(valor) {
  if (esVacio(valor)) return "Selecciona la hora.";
  if (!HORA_REGEX.test(String(valor).trim())) return "Usa el formato HH:mm.";
  return null;
}

/** Selección de catálogo/entidad: id numérico positivo. */
export function validarSeleccion(valor, mensaje = "Selecciona una opción.") {
  if (esVacio(valor)) return mensaje;
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) return mensaje;
  return null;
}

/** Suma segura de pesos (ignora valores inválidos), redondeada a 2 decimales. */
export function sumarPesos(residuos) {
  const total = (Array.isArray(residuos) ? residuos : []).reduce((acumulado, residuo) => {
    const peso = Number(residuo?.peso_kg);
    return acumulado + (Number.isFinite(peso) && peso > 0 ? peso : 0);
  }, 0);
  return Math.round(total * 100) / 100;
}

/**
 * Valida la lista de residuos de un recojo.
 * Devuelve errores por fila en `filas[index]` y un resumen en `errores`.
 */
export function validarResiduos(residuos) {
  const errores = [];
  const filas = {};

  if (!Array.isArray(residuos) || residuos.length === 0) {
    return {
      valido: false,
      errores: ["Agrega al menos un residuo."],
      filas,
    };
  }

  const tiposVistos = new Set();

  residuos.forEach((residuo, indice) => {
    const erroresFila = {};
    const errorTipo = validarSeleccion(
      residuo?.id_tipo_residuo,
      "Selecciona el tipo de residuo.",
    );

    if (errorTipo) {
      erroresFila.id_tipo_residuo = errorTipo;
    } else {
      const idTipo = Number(residuo.id_tipo_residuo);
      if (tiposVistos.has(idTipo)) {
        erroresFila.id_tipo_residuo = "Este tipo de residuo ya fue agregado.";
      } else {
        tiposVistos.add(idTipo);
      }
    }

    const errorPeso = validarPeso(residuo?.peso_kg);
    if (errorPeso) erroresFila.peso_kg = errorPeso;

    if (Object.keys(erroresFila).length > 0) {
      filas[indice] = erroresFila;
      errores.push(`Residuo ${indice + 1}: revisa los datos marcados.`);
    }
  });

  return {
    valido: Object.keys(filas).length === 0,
    errores,
    filas,
  };
}

/**
 * Comprueba que la suma de pesos no supere la capacidad del vehículo.
 * Devuelve `null` si es válido o un mensaje de error.
 */
export function validarCapacidadRecojo(residuos, capacidadKg) {
  const capacidad = Number(capacidadKg);
  if (!Number.isFinite(capacidad) || capacidad <= 0) {
    return "Selecciona un vehículo con capacidad válida.";
  }

  const total = sumarPesos(residuos);
  if (total <= 0) {
    return "Agrega al menos un residuo con peso mayor a 0.";
  }
  if (total > capacidad) {
    return `El peso total (${total.toFixed(2)} kg) supera la capacidad del vehículo (${capacidad.toFixed(2)} kg).`;
  }
  return null;
}

/** Valida el formulario de cliente. En edición el RUC no se envía. */
export function validarCliente(datos, opciones = {}) {
  const { esEdicion = false } = opciones;
  const errores = {};

  const errorRazon = validarRequerido(datos?.razon_social, "La razón social es obligatoria.");
  if (errorRazon) errores.razon_social = errorRazon;

  if (!esEdicion) {
    const errorRuc = validarRuc(datos?.ruc);
    if (errorRuc) errores.ruc = errorRuc;
  }

  if (!esVacio(datos?.correo)) {
    const errorCorreo = validarCorreo(datos.correo);
    if (errorCorreo) errores.correo = errorCorreo;
  }

  const errorTelefono = validarTelefono(datos?.telefono);
  if (errorTelefono) errores.telefono = errorTelefono;

  return { valido: Object.keys(errores).length === 0, errores };
}

/** Valida el formulario de empleado. */
export function validarEmpleado(datos) {
  const errores = {};

  const errorNombres = validarRequerido(datos?.nombres, "Los nombres son obligatorios.");
  if (errorNombres) errores.nombres = errorNombres;

  const errorApellidos = validarRequerido(datos?.apellidos, "Los apellidos son obligatorios.");
  if (errorApellidos) errores.apellidos = errorApellidos;

  const errorDni = validarDni(datos?.dni);
  if (errorDni) errores.dni = errorDni;

  const errorTelefono = validarTelefono(datos?.telefono);
  if (errorTelefono) errores.telefono = errorTelefono;

  const errorCargo = validarSeleccion(datos?.id_cargo, "Selecciona un cargo.");
  if (errorCargo) errores.id_cargo = errorCargo;

  return { valido: Object.keys(errores).length === 0, errores };
}

/** Valida el formulario de vehículo. */
export function validarVehiculo(datos) {
  const errores = {};

  const errorTipo = validarSeleccion(datos?.id_tipo_vehiculo, "Selecciona el tipo de vehículo.");
  if (errorTipo) errores.id_tipo_vehiculo = errorTipo;

  const errorPlaca = validarPlaca(datos?.placa);
  if (errorPlaca) errores.placa = errorPlaca;

  const errorCapacidad = validarCapacidad(datos?.capacidad_kg);
  if (errorCapacidad) errores.capacidad_kg = errorCapacidad;

  return { valido: Object.keys(errores).length === 0, errores };
}

/** Valida el formulario de creación de usuario. */
export function validarUsuario(datos) {
  const errores = {};

  const errorEmpleado = validarSeleccion(datos?.id_empleado, "Selecciona un empleado.");
  if (errorEmpleado) errores.id_empleado = errorEmpleado;

  const errorCorreo = validarCorreo(datos?.correo);
  if (errorCorreo) errores.correo = errorCorreo;

  const errorPassword = validarPassword(datos?.password);
  if (errorPassword) errores.password = errorPassword;

  if (esVacio(datos?.confirmar_password)) {
    errores.confirmar_password = "Confirma la contraseña.";
  } else if (datos.confirmar_password !== datos.password) {
    errores.confirmar_password = "Las contraseñas no coinciden.";
  }

  const rol = String(datos?.rol ?? "").toUpperCase();
  if (!ROLES_VALIDOS.includes(rol)) errores.rol = "Selecciona un rol válido.";

  return { valido: Object.keys(errores).length === 0, errores };
}

/**
 * Valida el formulario completo de recojo.
 * `capacidadKg` es la capacidad del vehículo seleccionado (o null si no hay).
 */
export function validarRecojo(datos, capacidadKg) {
  const errores = {};

  const errorCliente = validarSeleccion(datos?.id_cliente, "Selecciona un cliente.");
  if (errorCliente) errores.id_cliente = errorCliente;

  const errorVehiculo = validarSeleccion(datos?.id_vehiculo, "Selecciona un vehículo.");
  if (errorVehiculo) errores.id_vehiculo = errorVehiculo;

  const errorCentro = validarSeleccion(
    datos?.id_centro_reciclaje,
    "Selecciona un centro de reciclaje.",
  );
  if (errorCentro) errores.id_centro_reciclaje = errorCentro;

  const errorEstado = validarSeleccion(
    datos?.id_estado_recojo,
    "Selecciona el estado inicial.",
  );
  if (errorEstado) errores.id_estado_recojo = errorEstado;

  const errorFecha = validarFecha(datos?.fecha_recojo);
  if (errorFecha) errores.fecha_recojo = errorFecha;

  const errorHora = validarHora(datos?.hora_recojo);
  if (errorHora) errores.hora_recojo = errorHora;

  const resultadoResiduos = validarResiduos(datos?.residuos);
  if (!resultadoResiduos.valido) {
    errores.residuos = resultadoResiduos.errores[0] ?? "Revisa los residuos.";
    errores.residuosFilas = resultadoResiduos.filas;
  }

  if (!errorVehiculo) {
    const errorCapacidad = validarCapacidadRecojo(datos?.residuos, capacidadKg);
    if (errorCapacidad && !errores.residuos) errores.capacidad = errorCapacidad;
  }

  const empleados = Array.isArray(datos?.empleados) ? datos.empleados : [];
  const idsEmpleados = empleados
    .map((empleado) =>
      Number(typeof empleado === "object" ? empleado?.id_empleado : empleado),
    )
    .filter((id) => Number.isInteger(id) && id > 0);

  if (new Set(idsEmpleados).size !== idsEmpleados.length) {
    errores.empleados = "No repitas empleados asignados.";
  }

  return {
    valido: Object.keys(errores).length === 0,
    errores,
    totalKg: sumarPesos(datos?.residuos),
  };
}
