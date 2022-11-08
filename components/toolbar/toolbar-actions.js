import css from "ustyler";
import db from "../../db";
import { html } from "uhtml";
import Globals from "../../globals";
import { TreeBase } from "../treebase";
import { ButtonWrap } from "../access";

export class toolbarAction {
    constructor(label, callback, id, actionType, componentType, keyMapping) {
        /** @type {string} */
        this.label = label;
        this.callback = callback;
        /** @type {number} */
        this.id = id;
        /** @type {string} */
        this.actionType = actionType;
        /** @type {string} */
        this.componentType = componentType;
        /** @type {string} */
        this.keyMapping = keyMapping;
    }
}

const addAction = new toolbarAction("Add action", () => console.log("added"), 1, "add", "action", null);
const addCue = new toolbarAction("Add cue", () => console.log("added"), 2, "add", "cue", null);
const deleteAction = new toolbarAction("Delete action", () => console.log("deleted"), 3, "delete", "action", null);
const deleteCue = new toolbarAction("Delete cue", () => console.log("added"), 4, "delete", "cue", null);

export const toolbarActions = [addAction, addCue, deleteAction, deleteCue];