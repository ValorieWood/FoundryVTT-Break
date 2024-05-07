import { RANK_XP} from "../constants.js";
import { BreakItem } from "../items/item.js";

const allowedItemTypes = ["quirk", "ability", "gift", "weapon", "armor"]

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class BreakActorSheet extends ActorSheet {

  //testSpecies = actor.system.species_list[2].label;
  //localizedSpecies = actor.system.species_list.map(species => game.i18n.localize(species.label));

  /** @inheritdoc */
  static get defaultOptions() {
    this.selectedBag = null;

    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["break", "sheet", "actor"],
      template: "systems/break/templates/actors/actor-sheet.html",
      width: 750,
      height: 850,
      tabs: [{navSelector: ".tabs", contentSelector: ".sheet-body", initial: "identity"}],
      scrollY: [".content"],
      dragDrop: [{dragSelector: ".directory-item.document", dropSelector: null, permissions: {drop: () => false}},
        {dragSelector: ".bag-item", dropSelector: ".equipment-drag-slot"}]
    });
  }

  /** @inheritDoc */
  _onDragStart(event) {
    // Add another deferred deactivation to catch the second pointerenter event that seems to be fired on Firefox.
    const data = event.target.closest(".bag-item")?.dataset ?? {};
    if ( !data.type ) return super._onDragStart(event);
    event.dataTransfer.setData("application/json", JSON.stringify(data));
  }


  /** @inheritDoc */
  _canDragDrop(selector) {
    return this.isEditable;
  }

  /** @inheritdoc */
  async _onDrop(event) {
    const t = event.target.closest(".equipment-drag-slot")
    if(!event.target.closest(".equipment-drag-slot")) return super._onDrop(event);
    const dragData = event.dataTransfer.getData("application/json");
    if ( !dragData ) return super._onDrop(event);
    const id = JSON.parse(dragData).id;
    const item = this.actor.items.find(i => i._id == id);
    this._onEquipItem(item);
    
    return true;
  }


  /** @override */
  async _onDropItem(event, data) {
    if ( !this.actor.isOwner ) return false;
    const item = await Item.implementation.fromDropData(data);
    if(!allowedItemTypes.includes(item.type)) {return false;}
    if(this.actor.items.some(i => i._id === item._id)) {return false;}

    return BreakItem.createDocuments([item], {pack: this.actor.pack, parent: this.actor, keepId: true});
  }

  /** @inheritdoc */
  async getData(options) {
    //getDataCount++;

    const context = await super.getData(options);

    //context.getDataCount = getDataCount;

    context.shorthand = !!game.settings.get("break", "macroShorthand");
    context.biographyHTML = await TextEditor.enrichHTML(context.actor.system.biography, {
      secrets: this.document.isOwner,
      async: true
    });

    context.actor.system.hearts.value = context.actor.system.hearts.value ?? context.actor.system.hearts.max;

    for(let i = 0; i < RANK_XP.length; i++){
      if(RANK_XP[i] <= context.actor.system.xp.current){
        context.rank = i+1;
      } else {
        context.xpNextRank = RANK_XP[i]-context.actor.system.xp.current;
        break;
      }
    }

    let calling_id = context.actor.system.calling.value;
    let previous_calling_id = context.actor.system.calling.previous;

    let calling_changed = calling_id != previous_calling_id;
    if (calling_changed) {
      console.log("Calling changed from " + previous_calling_id + " to " + calling_id)
    }

    let species_id = context.actor.system.species.value;
    console.log("Species Id: " + species_id);
    let species = context.actor.system.species_list[species_id];
    console.log("Species label: " + species.label);
    console.log("Species size: " + species.size);

    let size = context.actor.system.size_list[species.size];

    let calling = context.actor.system.calling_list[calling_id];
    context.actor.system.aptitudes.might.base = calling.stats.might + size.might;
    context.actor.system.aptitudes.deftness.base = calling.stats.deftness + size.deftness;
    context.actor.system.aptitudes.grit.base = calling.stats.grit;
    context.actor.system.aptitudes.insight.base = calling.stats.insight;
    context.actor.system.aptitudes.aura.base = calling.stats.aura;

    context.actor.system.attack.base = calling.stats.attack;
    context.actor.system.defense.base = calling.stats.defense + size.defense;
    context.actor.system.hearts.max = calling.stats.hearts;
    context.actor.system.speed.value = calling.stats.speed;

    context.size = size.label;

    let homeland_id = context.actor.system.homeland.value;
    console.log("Homeland Id: " + homeland_id);
    let homeland = context.actor.system.homeland_list[homeland_id];
    context.history_list = homeland.history_list;

    // Reset player hearts so they don't exceed maximum, in case that changed
    let maxHearts = context.actor.system.hearts.max + context.actor.system.hearts.bon;
    context.actor.system.hearts.value = Math.min(context.actor.system.hearts.value, maxHearts);

    context.abilities = context.actor.items.filter(i => i.type === "ability");
    context.gifts = context.actor.items.filter(i => i.type === "gift");
    context.quirks = context.actor.items.filter(i => i.type === "quirk");
    context.weapons = context.actor.items.filter(i => i.type === "weapon");
    context.weapons = context.weapons.map(w => {
      return {
        id: w._id,
        name: w.name,
        type: (w.system.weaponType1?.name ?? "") + " " + (w.system.weaponType2?.name ?? ""),
        isRanged: w.system.weaponType1?.system.ranged || w.system.weaponType2?.system.ranged,
        isMelee: (w.system.weaponType1 && !w.system.weaponType1.system.ranged) || (w.system.weaponType2 && !w.system.weaponType2.system.ranged),
        rangedExtraDamage: w.system.rangedExtraDamage,
        extraDamage: w.system.extraDamage
      }
    });

    context.attackBonus = context.actor.system.attack.value + context.actor.system.attack.bon;
    context.defenseRating = +context.actor.system.defense.base + +context.actor.system.defense.bon + (context.actor.system.equipment.armor ? +context.actor.system.equipment.armor.system.defenseBonus : 0)
    context.speedRating = context.actor.system.speed.value + context.actor.system.speed.bon;
    if(context.actor.system.equipment.armor && context.actor.system.equipment.armor.system.speedLimit != null && context.actor.system.equipment.armor.system.speedLimit != "") {
      context.speedRating = +context.actor.system.equipment.armor.system.speedLimit < context.speedRating ? +context.actor.system.equipment.armor.system.speedLimit : context.speedRating;
    }

    if(+context.actor.system.allegiance.dark <= 1 && +context.actor.system.allegiance.bright <= 1){
      context.allegiance = 0;
    } else if(+context.actor.system.allegiance.dark > +context.actor.system.allegiance.bright+1){
      context.allegiance = 1;
    } else if(+context.actor.system.allegiance.bright > +context.actor.system.allegiance.dark+1) {
      context.allegiance = 3;
    } else {
      context.allegiance = 2;
    }

    const equipment = context.actor.system.equipment;
    const equippedItemIds = [equipment.armor?._id, equipment.outfit?._id, equipment.rightHand?._id, equipment.leftHand?._id, ...equipment.accesories.map(i => i._id)];
    context.bagContent = context.actor.items.filter(i => !["ability", "quirk", "gift"].includes(i.type)
    && !equippedItemIds.includes(i._id) && i.bag == this.selectedBag).map(i => ({...i, _id: i._id, equippable: ["armor", "weapon", "outfit", "accesory", "shield"].includes(i.type)}));
    context.freeInventorySlots = context.actor.system.slots - context.bagContent.reduce((ac, cv) => ac + cv.system.slots, 0);

    // context.actor.system.calling_list.map(calling => {
    //   calling.label += "alsdkjf";
    //   return calling;
    // })

    //context.actor.system.calling_list.foreach(c => {console.log(c.label)});

    // for (let [calling] of Object.values(context.actor.system.calling_list)) {
    //   //calling.label = calling.label + " do localize";
    // }

    // for (let [calling] of Object.values(context.actor.system.calling_list)) {
    //   calling.label = game.i18n.localize(calling.label);
    // }

    return context;
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  activateListeners(html) {
    super.activateListeners(html);

    html.find(".aptitude-value-circle.clickable").on("click", this._onRollAptitude.bind(this));
    html.find(".combat-value-circle.clickable").on("click", this._onRollAttack.bind(this));

    html.find("i.attack-ranged").on("click", this._onRollAttack.bind(this));
    html.find("i.attack-melee").on("click", this._onRollAttack.bind(this));

    // Everything below here is only needed if the sheet is editable
    if ( !this.isEditable ) return;

    html.find(".aptitude-container").on("click", ".aptitude-trait", this._onSetTrait.bind(this));

    html.find(".delete-ability").on("click", this._onDeleteItem.bind(this));
    html.find(".delete-gift").on("click", this._onDeleteItem.bind(this));
    html.find(".delete-quirk").on("click", this._onDeleteItem.bind(this));

    html.find("button.hearts.clickable").on("click", this._onModifyHearts.bind(this));

    html.find("i.delete-weapon").on("click", this._onDeleteItem.bind(this));
    html.find("i.remove-item").on("click", this._onDeleteItem.bind(this));
    html.find("i.unequip-item").on("click", this._onUnequipItem.bind(this));


    // Add draggable for Macro creation
    html.find(".aptitudes a.aptitude-roll").each((i, a) => {
      a.setAttribute("draggable", true);
      a.addEventListener("dragstart", ev => {
        let dragData = ev.currentTarget.dataset;
        ev.dataTransfer.setData('text/plain', JSON.stringify(dragData));
      }, false);
    });

    let selectCalling = document.getElementById('selectcalling');
    selectCalling.addEventListener('change', function(event) {
      let selectedCalling = event.target.value;
      console.log("Event fired, selected calling: " + selectedCalling);
      // TODO: figure this bit out
      //this.actor.update({"system.calling.previous": this.actor.get("system.calling.value")})
    });
  }

  /* -------------------------------------------- */

  async _onSetTrait(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const aptitude = button.parentElement.children[1].dataset.aptitude;
    const value = button.dataset.option;
    if(aptitude == undefined || value == undefined) {
      return;
    }
    this.actor.setAptitudeTrait(aptitude, +value)
  }

  async _onEquipItem(item) {
    switch(item.type){
      case "armor":
        this.actor.update({"system.equipment.armor": {...item, _id: item._id}});
        return;
      case "outfit":
        //this.actor.update({"system.equipment.outfit": item});
        return;
    }
  }

  async _onUnequipItem(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const type = button.dataset.type;
    const updates = {};
    updates[`system.equipment.${type}`] = null;
    this.actor.update(updates);
  }

  async _onDeleteItem(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const id = button.dataset.id;
    this.actor.deleteItem(id);
  }

  async _onRollAptitude(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const aptitudeId = button.dataset.id;
    this.actor.rollAptitude(aptitudeId)
  }

  async _onRollAttack(event) {
    event.preventDefault();
    const button = event.currentTarget;
    const bonus = button.dataset.bonus ?? 0;
    const extraDamage = button.dataset.extradamage ?? 0;
    this.actor.rollAttack(bonus, extraDamage)
  }

  async _onModifyHearts(event) {
    event.preventDefault();
    const amount = event.currentTarget.dataset.amount;
    this.actor.modifyHp(+amount);
  }

  /* -------------------------------------------- */

  /**
   * Listen for roll buttons on items.
   * @param {MouseEvent} event    The originating left click event
   */
  _onItemRoll(event) {
    let button = $(event.currentTarget);
    const li = button.parents(".item");
    const item = this.actor.items.get(li.data("itemId"));
    let r = new Roll(button.data('roll'), this.actor.getRollData());
    return r.toMessage({
      user: game.user.id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `<h2>${item.name}</h2><h3>${button.text()}</h3>`
    });
  }

  /* -------------------------------------------- */

  /** @inheritdoc */
  _getSubmitData(updateData) {
    let formData = super._getSubmitData(updateData);
    return formData;
  }
}
