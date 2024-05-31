import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootswatch/dist/pulse/bootstrap.min.css';
import '../../style.css'
import { initStickyEvents } from './events/stickyIpcEvents';
import { setupDragging } from './ui/uiSticky';

initStickyEvents()
setupDragging()
