/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {

  // Define template paths to load
  const templatePaths = [
    // Attribute list partial.
    "systems/break/templates/actors/parts/sheet-aptitudes.html",
    "systems/break/templates/actors/parts/sheet-identity.html",
    "systems/break/templates/actors/parts/sheet-combat.html",
    "systems/break/templates/actors/parts/sheet-abilities.html",
    "systems/break/templates/actors/parts/sheet-xp.html",
    "systems/break/templates/actors/parts/sheet-allegiance.html",
    "systems/break/templates/actors/parts/sheet-weapon-card.hbs",
    "systems/break/templates/rolls/roll-check.hbs",
    "systems/break/templates/rolls/roll-dialog.hbs",
    "systems/break/templates/items/item-header.hbs",
    "systems/break/templates/items/parts/weapon-abilities.hbs",
    "systems/break/templates/items/parts/weapon-details.hbs"
  ];

  // Load the template parts
  return loadTemplates(templatePaths);
};