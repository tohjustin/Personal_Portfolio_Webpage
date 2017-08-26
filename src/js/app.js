import feather from 'feather-icons';

const ICON_SIZE = 28;
const ICON_STROKE_WIDTH = 2;

function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

ready(() => {
  feather.replace({
    height: `${ICON_SIZE}px`,
    'stroke-width': ICON_STROKE_WIDTH,
    width: `${ICON_SIZE}px`,
  });
});
