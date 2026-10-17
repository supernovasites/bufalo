import {handleEmail} from '../../_lib/email-marketing.js';
export const onRequest = context => handleEmail(context);
