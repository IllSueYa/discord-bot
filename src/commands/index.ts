import {
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  ModalSubmitInteraction,
  StringSelectMenuBuilder,
} from 'discord.js';
import fs from 'fs';
import path from 'path';

import {Command} from '../interfaces';
import campaign from './campaign';
import dispatches from './dispatches';
import events from './events';
import history from './history';
import items from './items';
import links from './links';
import map from './map';
import planet from './planet';
import subscribe from './subscribe';
import summary from './summary';
import superstore from './superstore';
import updates from './updates';
// import warbond from './warbond';
import wiki from './wiki';
import {Category, WikiData} from '../handlers';

const commandList: Command[] = [
  campaign,
  links,
  dispatches,
  events,
  history,
  items,
  map,
  planet,
  subscribe,
  summary,
  // superstore,
  updates,
  // warbond,
  // wiki,
];
const notEphemeral: string[] = [];
const ephemeralCmds = commandList
  .map(x => x.data.name)
  .filter(x => !notEphemeral.includes(x));

const commandHash: Record<
  string,
  (interaction: CommandInteraction) => Promise<void>
> = {};
for (const command of commandList) commandHash[command.data.name] = command.run;

const modalHash: Record<
  string,
  (interaction: ModalSubmitInteraction) => Promise<void>
> = {};

// elevated commands -- not for base users
const ownerCmds: string[] = [];

// cycle through non-admin commands as status
const presenceCmds = Object.keys(commandHash)
  .filter(x => ![...ownerCmds].includes(x))
  .map(x => `/${x}`);

// commands to offer planet autocomplete suggestions for
const planetAutoCmds = ['planet', 'map'];
const campaignAutoCmds = ['campaign'];
const itemAutoCmds = ['items'];

// commands to not defer/suggestion etc. instead provide a modal for further input
const modalCmds: string[] = [];

// load the wiki pages
const wikiCmd: {
  buttons: ButtonBuilder[];
  dirSelect: Record<string, StringSelectMenuBuilder>;
  categories: Category[];
  pages: WikiData[];
} = {
  buttons: [],
  dirSelect: {},
  categories: [],
  pages: [],
};

const wikiPath = path.join(process.cwd(), 'wiki');
const categoryPath = path.join(wikiPath, 'index.json');

const categories = JSON.parse(
  fs.readFileSync(categoryPath, 'utf8')
) as Category[];

wikiCmd.categories = categories;

for (const category of categories) {
  const categoryDirectory = path.join(wikiPath, category.directory);

  if (!fs.existsSync(categoryDirectory)) {
    console.warn(`Wiki category directory not found: ${category.directory}`);
    continue;
  }

  const files = fs
    .readdirSync(categoryDirectory)
    .filter(file => file.endsWith('.json'));

  const categoryPages: WikiData[] = [];

  for (const file of files) {
    const filePath = path.join(categoryDirectory, file);

    const page = JSON.parse(
      fs.readFileSync(filePath, 'utf8')
    ) as WikiData;

    wikiCmd.pages.push(page);
    categoryPages.push(page);
  }

  const button = new ButtonBuilder()
    .setCustomId(category.directory)
    .setLabel(category.display_name || category.directory)
    .setStyle(ButtonStyle.Secondary);

  wikiCmd.buttons.push(button);

  if (categoryPages.length > 0) {
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(category.directory)
      .setPlaceholder(
        `Select a ${category.display_name || category.directory} page`
      )
      .addOptions(
        categoryPages.slice(0, 25).map(page => ({
          label: page.title,
          value: page.page,
          description:
            page.description && page.description.length > 0
              ? page.description.substring(0, 100)
              : undefined,
        }))
      );

    wikiCmd.dirSelect[category.directory] = selectMenu;
  }
}
  
export {
  
  commandList,
  commandHash,
  modalHash,
  ownerCmds,
  presenceCmds,
  modalCmds,
  ephemeralCmds,
  planetAutoCmds,
  campaignAutoCmds,
  itemAutoCmds,
  wikiCmd,
};
