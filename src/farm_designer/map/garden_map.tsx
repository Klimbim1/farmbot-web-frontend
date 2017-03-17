import * as React from "react";
import { Plant } from "../plant";
import { deprecatedSavePlant, savePlantById, movePlant } from "../actions";
import * as moment from "moment";
import { GardenMapProps, GardenMapState, PlantOptions } from "../interfaces";
import { GardenPlant } from "./garden_plant";
import { GardenPoint } from "./garden_point";
import { Link } from "react-router";

function fromScreenToGarden(mouseX: number, mouseY: number, boxX: number, boxY: number) {
  /** The offset of 50px is made for the setDragImage to make it in the
   * center of the mouse for accuracy which is why this is being done.
   * Once we get more dynamic with the values (different size plants),
   * we can tweak this accordingly.
   */
  let newMouseX = mouseX - 25;
  let newMouseY = mouseY - 25;
  /* */

  let rawX = newMouseX - boxX;
  let rawY = newMouseY - boxY;

  return { x: rawX, y: rawY };
}

export class GardenMap extends React.Component<GardenMapProps, GardenMapState> {
  state = { activePlant: undefined, tempX: undefined, tempY: undefined };

  handleDragOver(e: React.DragEvent<HTMLElement>) {
    // Perform drop availability here probably
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  handleDragEnter(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
  }

  findCrop(slug?: string) {
    let crops = this.props.designer.cropSearchResults;
    let crop = _(crops).find((result) => result.crop.slug === slug);
    return crop || {
      crop: {
        binomial_name: "binomial_name",
        common_names: "common_names",
        name: "name",
        row_spacing: "row_spacing",
        spread: "spread",
        description: "description",
        height: "height",
        processing_pictures: "processing_pictures",
        slug: "slug",
        sun_requirements: "sun_requirements"
      },
      image: "http://placehold.it/350x150"
    };
  }

  handleDrop(e: React.DragEvent<HTMLElement>) {
    e.preventDefault();
    let el = document.querySelector("#drop-area > svg");
    if (el) {
      let box = el.getBoundingClientRect();
      let p: PlantOptions = fromScreenToGarden(e.pageX, e.pageY, box.left, box.top);
      // TEMPORARY SOLUTION =======
      let OFEntry = this.findCrop(this.props.params.species);
      p.img_url = OFEntry.image;
      p.openfarm_slug = OFEntry.crop.slug;
      p.name = OFEntry.crop.name || "Mystery Crop";
      p.planted_at = moment().toISOString();
      p.spread = OFEntry.crop.spread;
      // END TEMPORARY SOLUTION =======
      let plant = Plant(p);
      this.props.dispatch(deprecatedSavePlant(plant));
    } else {
      throw new Error("never");
    }
  }

  render() {
    let { dispatch } = this.props;
    let updater = (deltaX: number, deltaY: number, plantId: number) => {
      dispatch(movePlant({ deltaX, deltaY, plantId }));
    };

    let dropper = (id: number) => {
      dispatch(savePlantById(id));
    };

    return <div className="drop-area"
      id="drop-area"
      onDrop={this.handleDrop.bind(this)}
      onDragEnter={this.handleDragEnter.bind(this)}
      onDragOver={this.handleDragOver.bind(this)}>
      <svg id="svg">
        {this.props.points.map(function (p) {
          return <GardenPoint point={p} key={p.id} />;
        })}
        {
          this.props.plants.map((p, inx) => {
            let { pathname } = this.props.location;
            if (p.id) {
              let isActive = (pathname.includes(p.id.toString()) &&
                pathname.includes("edit")) ? "active" : "";

              return <Link to={`/app/designer/plants/${p.id}`}
                className={`plant-link-wrapper ` + isActive.toString()}
                key={p.id}>
                <GardenPlant
                  plant={p}
                  onUpdate={updater}
                  onDrop={dropper} />
              </Link>;
            } else {
              throw new Error("Never.");
            }
          })
        }
      </svg>
    </div>;
  }
}
