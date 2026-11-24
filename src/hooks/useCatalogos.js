import { useCallback, useEffect, useRef, useState } from "react";
import { getApiError } from "../api/axiosClient";
import { obtenerCatalogos } from "../services/catalogoService";
import { CATALOGOS_VACIOS, normalizarCatalogos } from "../utils/formatters";

/**
 * Carga GET /catalogos una sola vez por montaje.
 * Devuelve { catalogos, cargando, error, recargar }.
 */
export function useCatalogos() {
  const [catalogos, setCatalogos] = useState(CATALOGOS_VACIOS);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const montadoRef = useRef(true);

  const recargar = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const datos = await obtenerCatalogos();
      if (montadoRef.current) {
        setCatalogos(normalizarCatalogos(datos));
      }
    } catch (err) {
      if (montadoRef.current) setError(getApiError(err));
    } finally {
      if (montadoRef.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    montadoRef.current = true;
    let activo = true;

    async function cargarInicial() {
      try {
        const datos = await obtenerCatalogos();
        if (activo) setCatalogos(normalizarCatalogos(datos));
      } catch (err) {
        if (activo) setError(getApiError(err));
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarInicial();

    return () => {
      activo = false;
      montadoRef.current = false;
    };
  }, []);

  return { catalogos, cargando, error, recargar };
}
