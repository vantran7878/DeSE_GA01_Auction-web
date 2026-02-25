import path from 'path';
import { fileURLToPath } from 'url';
import { engine } from 'express-handlebars';
import expressHandlebarsSections from 'express-handlebars-sections';
import helpers from '../utils/helpers/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

export function configViewEngine(app) {
  app.engine('handlebars', engine({
    defaultLayout: 'main',
    helpers: {
      section: expressHandlebarsSections(),
      ...helpers,
    },
    partialsDir: [
      path.join(__dirname, '../views/partials'),
      path.join(__dirname, '../views/vwAccount'),
    ],
  }));

  app.set('view engine', 'handlebars');
  app.set('views', './views');
}