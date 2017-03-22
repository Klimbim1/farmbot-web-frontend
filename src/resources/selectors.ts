import { ResourceIndex } from "./interfaces";
import { joinKindAndId } from "./reducer";
import {
  ResourceName,
  TaggedFarmEvent,
  TaggedResource,
  TaggedPoint,
  TaggedPlant,
  TaggedTool,
  TaggedToolSlot,
  TaggedImage,
  TaggedRegimen,
  TaggedSequence,
  isTaggedSequence,
  isTaggedRegimen,
  TaggedToolBay,
  isTaggedTool,
  isTaggedToolSlot,
  isTaggedResource,
  sanityCheck
} from "./tagged_resources";
import { selectAll } from "./util";
import { CowardlyDictionary } from "../util";
import { error } from "../ui/logger";

export let findUuid = (index: ResourceIndex, kind: ResourceName, id: number) => {
  let uuid = index.byKindAndId[joinKindAndId(kind, id)];
  assertUuid(kind, uuid);
  if (uuid) {
    return uuid;
  } else {
    throw new Error("UUID not found for id " + id)
  }
}

export function findResourceById(index: ResourceIndex, kind: ResourceName,
  id: number) {
  let uuid = findUuid(index, kind, id);
  assertUuid(kind, uuid);
  return uuid;
}

export let isKind = (name: ResourceName) =>
  (tr: TaggedResource) => tr.kind === name;

function findAll(index: ResourceIndex, name: ResourceName) {
  let results: TaggedResource[] = [];
  index.byKind[name].map(function (uuid) {
    let item = index.references[uuid];
    (item && isTaggedResource(item) && results.push(item));
  })
  return results;
}

export function selectAllFarmEvents(index: ResourceIndex) {
  return findAll(index, "farm_events") as TaggedFarmEvent[];
}

export function selectAllPoints(index: ResourceIndex) {
  return findAll(index, "points") as TaggedPoint[];
}

export function selectAllPlants(index: ResourceIndex) {
  return findAll(index, "plants") as TaggedPlant[];
}

export function selectAllTools(index: ResourceIndex) {
  return findAll(index, "tools") as TaggedTool[];
}

export function selectAllToolSlots(index: ResourceIndex) {
  return findAll(index, "tool_slots") as TaggedToolSlot[];
}

interface Finder<T> {
  (i: ResourceIndex, u: string): T;
}
/** Generalized way to stamp out "finder" functions.
 * Pass in a `ResourceName` and it will add all the relevant checks.
 * WARNING: WILL THROW ERRORS IF RESOURCE NOT FOUND!
 */
let find = (r: ResourceName) =>
  function findResource(i: ResourceIndex, u: string) {
    assertUuid(r, u);
    let result = i.references[u];
    if (result && isTaggedResource(result) && sanityCheck(result)) {
      return result as TaggedResource;
    } else {
      error("Resource error");
      throw new Error(`Tagged resource ${r} was not found or malformed: ` +
        JSON.stringify(result));
    }

  }

export let findToolSlot = find("tool_slots") as Finder<TaggedToolSlot>;
export let findTool = find("tools") as Finder<TaggedTool>;
export let findSequence = find("sequences") as Finder<TaggedSequence>;

export function selectCurrentToolSlot(index: ResourceIndex, uuid: string) {
  return index.references[uuid];
}

export function selectAllToolBays(index: ResourceIndex) {
  return findAll(index, "tool_bays") as TaggedToolBay[];
}

export function selectAllImages(index: ResourceIndex) {
  return findAll(index, "images") as TaggedImage[];
}

export function selectAllRegimens(index: ResourceIndex) {
  return findAll(index, "regimens") as TaggedRegimen[];
}

export function getRegimenByUUID(index: ResourceIndex, kind: ResourceName, uuid: string) {
  assertUuid(kind, uuid);
  return index.references[uuid];
}

export function selectAllSequences(index: ResourceIndex) {
  return findAll(index, "sequences") as TaggedSequence[];
}

export function indexSequenceById(index: ResourceIndex) {
  let output: CowardlyDictionary<TaggedSequence> = {};
  let uuids = index.byKind.sequences;
  uuids.map(uuid => {
    assertUuid("sequences", uuid);
    let sequence = index.references[uuid];
    if (sequence && isTaggedSequence(sequence) && sequence.body.id) {
      output[sequence.body.id] = sequence;
    }
  });
  return output;
}

export function indexRegimenById(index: ResourceIndex) {
  let output: CowardlyDictionary<TaggedRegimen> = {};
  let uuids = index.byKind.regimens;
  uuids.map(uuid => {
    assertUuid("regimens", uuid);
    let regimen = index.references[uuid];
    if (regimen && isTaggedRegimen(regimen) && regimen.body.id) {
      output[regimen.body.id] = regimen;
    }
  });
  return output;
}

export function indexByToolId(index: ResourceIndex) {
  let output: CowardlyDictionary<TaggedTool> = {};
  let uuids = index.byKind.tools;
  uuids.map(uuid => {
    assertUuid("tools", uuid);
    let Tool = index.references[uuid];
    if (Tool && isTaggedTool(Tool) && Tool.body.id) {
      output[Tool.body.id] = Tool;
    }
  });
  return output;
}

export function indexBySlotId(index: ResourceIndex) {
  let output: CowardlyDictionary<TaggedToolSlot> = {};
  let uuids = index.byKind.tool_slots;
  uuids.map(uuid => {
    assertUuid("tool_slots", uuid);
    let tool_slot = index.references[uuid];
    if (tool_slot && isTaggedToolSlot(tool_slot) && tool_slot.body.id) {
      output[tool_slot.body.id] = tool_slot;
    }
  });
  return output;
}

/** Concerned about all the run-time stuff going on.
 * Leaving this function here to aid in debugging as we make the switch to
 * tagged_resources
 *   -- RC, 21 MAR 17
 */
export function assertUuid(expected: ResourceName, actual: string | undefined) {
  if (actual && !actual.startsWith(expected)) {
    console.warn(`
    BAD NEWS!!! You thought this was a ${expected} UUID, but here's what it
    actually was:
      ${actual}
    `)
    return false;
  } else {
    return true;
  }
}

export function toArray(index: ResourceIndex) {
  return index.all.map(function (uuid) {
    let tr = index.references[uuid];
    if (tr) {
      return tr;
    } else {
      throw new Error("Fund bad index UUID: " + uuid);
    }
  });
}

/** Search for matching key/value pairs in the body of a resource. */
export function where(index: ResourceIndex,
  body: object): (TaggedResource | undefined)[] {
  return _.where(toArray(index), { body });
}

/** Search for matching key/value pairs in the body of a resource. */
export function findWhere(index: ResourceIndex,
  body: object): TaggedResource | undefined {
  /** TODO: Find a way to add type safety.
   *        currently, this method will accept any old object, which might be
   *        unsafe. */
  return _.findWhere(toArray(index), { body });
}