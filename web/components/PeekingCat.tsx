import { CatFace } from "@/components/CatFace";

// Agujero en el pie del que se asoma el gato: las orejas sobresalen por encima del borde y las patitas se apoyan en el frente.
// Decorativo; las pupilas siguen al puntero porque CatFace ya lo hace.
// En celular va abajo y centrado, justo encima de las barras flotantes (el pie suma aire para él); desde sm, a la derecha.
export function PeekingCat() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute bottom-[88px] left-1/2 h-9 w-28 -translate-x-1/2 sm:bottom-auto sm:left-auto sm:right-[10%] sm:top-[100px] sm:translate-x-0">
      <span className="absolute inset-0 rounded-[50%] bg-[var(--hole)] shadow-[inset_0_3px_0_rgb(0_0_0/0.25)]" />
      <div className="absolute bottom-[6px] left-1/2 w-24 -translate-x-1/2">
        <CatFace className="block w-full" />
        <span className="absolute -bottom-1 left-[22%] h-3 w-5 rounded-full border-[2.5px] border-[#3D2825] bg-[#8B8791]" />
        <span className="absolute -bottom-1 right-[22%] h-3 w-5 rounded-full border-[2.5px] border-[#3D2825] bg-[#8B8791]" />
      </div>
    </div>
  );
}
