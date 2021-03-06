import { scale, round, translateScreenToGarden } from "../util";

describe("Utils", () => {
  it("scales a number", () => {
    expect(Math.round(scale(100))).toEqual(490);
  });

  it("rounds a number", () => {
    expect(round(44)).toEqual(40);
    expect(round(98)).toEqual(100);
  });

  it("translates garden coords to screen coords", () => {

    let cornerCase = translateScreenToGarden({
      pageX: 520,
      pageY: 212,
      zoomLvl: 1
    });
    expect(cornerCase.x).toEqual(200);
    expect(cornerCase.y).toEqual(102);

    let edgeCase = translateScreenToGarden({
      pageX: 1132,
      pageY: 382,
      zoomLvl: 0.3
    });

    expect(Math.round(edgeCase.x)).toEqual(2707);
    expect(Math.round(edgeCase.y)).toEqual(907);
  });
});
