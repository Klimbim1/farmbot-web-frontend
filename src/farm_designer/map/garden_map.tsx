import * as React from "react";
import { Plant, DEFAULT_PLANT_RADIUS } from "../plant";
import { movePlant } from "../actions";
import * as moment from "moment";
import { GardenMapProps, GardenMapState } from "../interfaces";
import { history } from "../../history";
import { initSave, save, edit } from "../../api/crud";
import { TaggedPlantPointer } from "../../resources/tagged_resources";
import { translateScreenToGarden, round, ScreenToGardenParams } from "./util";
import { findBySlug } from "../search_selectors";
import { PlantLayer } from "./layers/plant_layer";
import { PointLayer } from "./layers/point_layer";
import { SpreadLayer } from "./layers/spread_layer";
import { ToolSlotLayer } from "./layers/tool_slot_layer";
import { HoveredPlantLayer } from "./layers/hovered_plant_layer";

const DROP_ERROR = `ERROR - Couldn't get zoom level of garden map, check the
  handleDrop() method in garden_map.tsx`;

export class GardenMap extends
  React.Component<GardenMapProps, Partial<GardenMapState>> {
  constructor() {
    super();
    this.state = {};
  }

  endDrag = () => {
    let p = this.getPlant();
    if (p) {
      this.props.dispatch(edit(p, { x: round(p.body.x), y: round(p.body.y) }));
      this.props.dispatch(save(p.uuid));
    }
    this.setState({ isDragging: false, pageX: 0, pageY: 0 });
  }

  startDrag = (): void => this.setState({ isDragging: true });

  get isEditing(): boolean { return location.pathname.includes("edit"); }

  getPlant = (): TaggedPlantPointer | undefined => this.props.selectedPlant;

  handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  handleDragEnter = (e: React.DragEvent<HTMLElement>) => e.preventDefault();

  findCrop(slug?: string) {
    return findBySlug(this.props.designer.cropSearchResults || [], slug);
  }

  handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    let el = document.querySelector("#drop-area > svg");
    let map = document.querySelector(".farm-designer-map");
    let page = document.querySelector(".farm-designer");
    if (el && map && page) {
      let zoomLvl = parseFloat(window.getComputedStyle(map).zoom || DROP_ERROR);
      let { pageX, pageY } = e;
      let box = el.getBoundingClientRect();
      let species = history.getCurrentLocation().pathname.split("/")[5];
      let OFEntry = this.findCrop(species);
      let params: ScreenToGardenParams = {
        pageX: pageX + page.scrollLeft,
        pageY: pageY + map.scrollTop,
        zoomLvl
      };
      let { x, y } = translateScreenToGarden(params);
      let p: TaggedPlantPointer = {
        kind: "points",
        uuid: "--never",
        dirty: true,
        body: Plant({
          x,
          y,
          openfarm_slug: OFEntry.crop.slug,
          name: OFEntry.crop.name || "Mystery Crop",
          created_at: moment().toISOString(),
          radius: DEFAULT_PLANT_RADIUS
        })
      };
      this.props.dispatch(initSave(p));
    } else {
      throw new Error("never");
    }
  }

  drag = (e: React.MouseEvent<SVGElement>) => {
    let plant = this.getPlant();
    if (this.isEditing && this.state.isDragging && plant) {
      let deltaX = e.pageX - (this.state.pageX || e.pageX);
      let deltaY = e.pageY - (this.state.pageY || e.pageY);
      this.setState({ pageX: e.pageX, pageY: e.pageY });
      this.props.dispatch(movePlant({ deltaX, deltaY, plant }));
    }
  }

  render() {
    return <div className="drop-area"
      id="drop-area"
      onDrop={this.handleDrop}
      onDragEnter={this.handleDragEnter}
      onDragOver={this.handleDragOver}>
      <svg
        id="drop-area-svg"
        onMouseUp={this.endDrag}
        onMouseDown={this.startDrag}
        onMouseMove={this.drag}>
        <SpreadLayer
          botOriginQuadrant={this.props.designer.botOriginQuadrant}
          plants={this.props.plants}
          currentPlant={this.getPlant()}
          visible={!!this.props.showSpread}
        />
        <PointLayer
          botOriginQuadrant={this.props.designer.botOriginQuadrant}
          visible={!!this.props.showPoints}
          points={this.props.points}
        />
        <PlantLayer
          botOriginQuadrant={this.props.designer.botOriginQuadrant}
          dispatch={this.props.dispatch}
          visible={!!this.props.showPlants}
          plants={this.props.plants}
          crops={this.props.crops}
          currentPlant={this.getPlant()}
          dragging={!!this.state.isDragging}
          editing={!!this.isEditing}
        />
        <ToolSlotLayer
          botOriginQuadrant={this.props.designer.botOriginQuadrant}
          visible={!!this.props.showFarmbot}
          slots={this.props.toolSlots}
        />
        <HoveredPlantLayer
          isEditing={this.isEditing}
          botOriginQuadrant={this.props.designer.botOriginQuadrant}
          currentPlant={this.getPlant()}
          designer={this.props.designer}
          dispatch={this.props.dispatch}
          hoveredPlant={this.props.hoveredPlant}
        />
      </svg>
    </div>;
  }
}
