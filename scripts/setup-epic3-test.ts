import {getDb} from '../src/server/db';
import {migrate} from '../src/server/migrate';
import {seed} from '../src/server/dataset';
import {sourceDataset} from './read-source';
process.env.APP_MODE='local';process.env.LOCAL_DB_PATH='/tmp/prep-epic3-browser-db';const db=await getDb();await migrate(db);await seed(db,'local-owner',await sourceDataset());process.exit(0);
