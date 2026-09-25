// Static, server-less version of semaphore.
// Letters are turned into actor poses right here in the browser (same pose
// table as work/poses.js) and the message itself lives in the URL hash, so a
// shared link is simply static.html#swallows%20forever

var semaphore = (function() {
  var prefix = "28,1|0,23|0,0|-1,-36|1,-3|-3,-45|-17,-85|-28,-112|4,-87|9,-116";
  var sem = { "bottomR":      "|-3,-33|0,-60", // right hand
              "bottomL":      "|3,-33|0,-60", // left hand
              "bottomLeft":   "|-23,-30|-42,-42",
              "left":         "|-33,-2|-60,0",
              "topLeft":      "|-23,20|-42,42",
              "topR":         "|-3,33|0,60",
              "topL":         "|3,33|0,60",
              "topRight":     "|23,20|42,42",
              "right":        "|33,-2|60,0",
              "bottomRight":  "|23,-30|42,-42"
  };
  var arms = {
      "A": [sem.bottomLeft,  sem.bottomL],
      "B": [sem.left,        sem.bottomL],
      "C": [sem.topLeft,     sem.bottomL],
      "D": [sem.topR,        sem.bottomL],
      "E": [sem.bottomR,     sem.topRight],
      "F": [sem.bottomR,     sem.right],
      "G": [sem.bottomR,     sem.bottomRight],
      "H": [sem.left,        sem.bottomLeft],
      "I": [sem.topLeft,     sem.bottomLeft],
      "J": [sem.topR,        sem.right],
      "K": [sem.bottomLeft,  sem.topL],
      "L": [sem.bottomLeft,  sem.topRight],
      "M": [sem.bottomLeft,  sem.right],
      "N": [sem.bottomLeft,  sem.bottomRight],
      "O": [sem.topLeft,     sem.left],
      "P": [sem.left,        sem.topL],
      "Q": [sem.left,        sem.topRight],
      "R": [sem.left,        sem.right],
      "S": [sem.left,        sem.bottomRight],
      "T": [sem.topLeft,     sem.topL],
      "U": [sem.topLeft,     sem.topRight],
      "V": [sem.topR,        sem.bottomRight],
      "W": [sem.right,       sem.topRight],
      "X": [sem.bottomRight, sem.topRight],
      "Y": [sem.topLeft,     sem.right],
      "Z": [sem.bottomRight, sem.right],
      " ": [sem.bottomR,     sem.bottomL]  // end of word
  };

  // "Žluťoučký kůň" -> "ZLUTOUCKY KUN", anything without a pose is dropped
  function toLetters(message) {
    var text = message.normalize ? message.normalize('NFD') : message;
    text = text.replace(/[̀-ͯ]/g, '').toUpperCase()
               .replace(/[^A-Z ]/g, '').replace(/ +/g, ' ').trim();
    return text.split('');
  }

  function toPoses(letters) {
    var poses = [];
    for (var i = 0; i < letters.length; i++) {
      poses.push(prefix + arms[letters[i]].join(''));
    }
    return poses;
  }

  return { toLetters: toLetters, toPoses: toPoses };
})();

$(window).on('cmx:launched', function() {
  $('#sendmess').prop('disabled', false).text('show');
  if (location.hash.length > 1) {
    showMessage(readHash(), false);
  }
});

$(function() {
  $('#sendmess').click(function() {
    sendMessage($('#mess').val());
  });
  $('#mess').keydown(function(e) {
    if (e.which == 13) {
      sendMessage($('#mess').val());
    }
  });
  $(window).on('hashchange', function() {
    if (window.cmx && location.hash.length > 1) {
      showMessage(readHash(), false);
    }
  });
});

function readHash() {
  try {
    return decodeURIComponent(location.hash.substr(1));
  } catch (e) {
    return location.hash.substr(1);
  }
}

function sendMessage(mess) {
  var letters = semaphore.toLetters(mess);
  if (!letters.length) {
    $('#notif').text('nothing to signal, try some letters A-Z');
    return;
  }
  var url = location.href.split('#')[0] + '#' + encodeURIComponent(mess);
  $('#teaser').html('');
  $('#notif').html('share: ').append($('<a>').attr('href', url).text(mess));
  drawSemaphore(semaphore.toPoses(letters));
}

// someone sent us a link: draw it, but keep the text a secret until asked
function showMessage(mess, help) {
  var letters = semaphore.toLetters(mess);
  $('#teaser').html('send a reply :');
  $('#notif').html('');
  drawSemaphore(semaphore.toPoses(letters), help ? letters : null);
  if (!help) {
    $('#putithere').append('<br clear="all" />no comprendo ? <a id="gethelp" href="#">Get help</a>');
    $('#gethelp').click(function() {
      showMessage(mess, true);
      return false;
    });
  }
}

function drawSemaphore(poses, messText) { // = null
  var sceneStart = "<scene id='scene1'>";
  var sceneEnd = "</scene>";
  var actorTemplate = $("<actor></actor>");
  var bubbleTemplate = $("<bubble>");
  var bubOptions = [
    "-12,-4|-11,16|-37,46|15,52|-21,88|-31,95",
    "31,7|16,14|0,22|9,49|39,50|42,56",
    "25,2|17,14|-5,59|56,34|38,73|32,79",
    "-4,5|-11,16|1,32|-20,30|-9,42|-6,45"
  ];
  var colorOptions = ['red','green','blue','brown'];
  var spanTemplate = $('<tspan x="0" y="0em"></tspan>');
  var actors = [];
  var actorWidth = 125;
  for (var j = 0; j < poses.length; j++) {
    var bub = $('');
    if (messText && messText[j] != ' ') {
      bub = bubbleTemplate.attr('pose', randAI(bubOptions)).html(spanTemplate.attr('fill',randAI(colorOptions)).text(messText[j]));
    }
    actors.push(actorTemplate.attr('pose',poses[j]).attr('t','translate(' + (65 +(j) * actorWidth) + ',150)').html(bub).clone());
  }
  var sceneHtml = sceneStart;
  for (j = 0; j < actors.length; j++) {
    sceneHtml += actors[j].prop('outerHTML');
  }
  sceneHtml += sceneEnd;
  var scene = $(sceneHtml);
  scene.attr('width', (actorWidth + 3) * actors.length );
  $('#putithere').html(scene.prop('outerHTML'));
  var parser = new cmx.Parser(cmx);
  var sceneModels = parser.parseDoc($('#putithere'));
  for (var i = 0; i < sceneModels.length; i++) {
    var sceneModel = sceneModels[i];
    sceneModel.props.frame = false;
    sceneModel.materialize($(sceneModel.source));
  }
}

function randAI(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
