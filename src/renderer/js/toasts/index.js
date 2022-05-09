import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootswatch/dist/pulse/bootstrap.min.css';
import '../../style.css'
import { initToastEvents } from './events/toastIpcEvents'
import { enableInspectingHtml } from '../debug/debugHelpers';

initToastEvents()
enableInspectingHtml()
