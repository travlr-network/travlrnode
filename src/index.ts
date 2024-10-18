import dotenv from 'dotenv';
import { runNode } from './runNode';

dotenv.config();

runNode().catch(console.error);
