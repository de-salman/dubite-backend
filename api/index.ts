/**
 * Vercel serverless entry: export the Express app so Vercel can route requests to it.
 * Requires: npm run build (nest build) so ../dist/ exists.
 */
import { AppFactory } from '../dist/src/AppFactory';

const { expressApp } = AppFactory.create();
export default expressApp;
