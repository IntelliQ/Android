var queue;
var business;
var queueItem;

$(function(){
  requestQueueDetails();

  // add customer modal
  $("#sbmitNewCustomerButton").click(onJoinQueueModalSubmitted);
  $('#newCustomerName').keypress(function(e) {
    if (e.which == 13) {
      onJoinQueueModalSubmitted();
      return false;
    }
  });

  $("#activeQueueItemsSection").find("h5").text(getString("ticket"));
});

function requestQueueDetails() {
  var queueKeyId = getUrlParamOrCookie("queueKeyId");
  var request = intelliqApi.getQueue(queueKeyId).includeBusiness(true);
  request.send().then(function(data){
    try {
      var businesses = intelliqApi.getBusinessesFromResponse(data);
      if (businesses.length < 1) {
        throw "Business not found";
      }
      console.log(businesses);
      business = businesses[0];
      if (business.queues.length < 1) {
        throw "Queue not found";
      }

      queue = business.queues[0];
      var container = $("#queueContainer");
      renderQueues(business.queues, container);

      $("#joinQueueButton").click(function() {
        joinQueue(queue);
      });

      $("#leaveQueueButton").click(function() {
        leaveQueue(queue);
      });

      renderQueueStatus(queue, container);
      $("#joinQueueButton").removeClass("disabled");

      requestQueueItem();
    } catch(error) {
      console.log(error);
      ui.showErrorMessage(error);
    }
  }).catch(function(error){
    console.log(error);
    ui.showErrorMessage(error);
  });
}

function requestQueueItem() {
  var queueItemKeyId = getUrlParamOrCookie("queueItemKeyId");
  if (queueItemKeyId == null || queueItemKeyId.length < 1) {
    return;
  }
  var queueKeyId = getUrlParam("queueKeyId");
  var queueItem = JSON.parse(getUrlParamOrCookie("queueItem"));
  if (queueItem != null && queueItem.queueKeyId != queueKeyId) {
    // queueItem belongs to a different queue
    return;
  }

  var request = intelliqApi.getQueueItem(queueItemKeyId);
  request.send().then(function(data){
    try {
      queueItem = intelliqApi.getQueueItemsFromResponse(data)[0];

      var ticketActive = true;
      if (queueItem.status == intelliqApi.STATUS_CANCELED) {
        ticketActive = false;
        Materialize.toast(getString("statusCanceled"), 3000);
      } else if (queueItem.status == intelliqApi.STATUS_DONE) {
        ticketActive = false;
        Materialize.toast(getString("statusDone"), 3000);
      }

      if (ticketActive) {
        onQueueJoined(queueItem);
      } else {
        onQueueLeft();
      }
    } catch(error) {
      console.log(error);
    }
  }).catch(function(error){
    console.log(error);
  });
}

function renderQueueStatus(queue, container) {
  var wrapper = generateCardWrapper();
  var statusCard = ui.generateQueueStatusCard(queue);
  statusCard.renderIn(wrapper);
  wrapper.appendTo(container);
}

function joinQueue(queue) {
  // check if queue requires signin
  if (queue.requiresSignIn) {
    authenticator.requestGoogleSignInStatus().then(function(isSignedIn) {
      if (isSignedIn) {
        showJoinQueueModal();
      } else {
        // request a sign in
        authenticator.registerStatusChangeListener({
          onGoogleSignIn: function() {
            showJoinQueueModal();
          }
        });
        ui.showSignInForm();
      }
    }).catch(function(error) {
      ui.showErrorMessage(error);
    });
  } else {
    showJoinQueueModal();
  }
}

function leaveQueue(queue) {
  var cancelQueuetem = function() {
    Materialize.toast(getString("leavingQueue"), 3000);
    var queueItemKeyId = getUrlParamOrCookie("queueItemKeyId");
    var request = intelliqApi.markQueueItemAsCanceled(queue.key.id, queueItemKeyId);
    if (authenticator.getGoogleSignInStatus()) {
      request.setGoogleIdToken(authenticator.getGoogleUserIdToken());
    }

    request.send().then(function(data){
      try {
        console.log(data);
        onQueueLeft();
        tracking.trackEvent(tracking.CATEGORY_WEBAPP, "Queue item canceled", queue.name, queue.key.id);
        location.reload();
      } catch(error) {
        console.log(error);
        ui.showErrorMessage(error);
      }
    }).catch(function(error){
      console.log(error);
      ui.showErrorMessage(error);
    });
  }

  // check if queue requires signin
  if (queue.requiresSignIn) {
    authenticator.requestGoogleSignInStatus().then(function(isSignedIn) {
      if (isSignedIn) {
        cancelQueuetem();
      } else {
        // request a sign in
        authenticator.registerStatusChangeListener({
          onGoogleSignIn: function() {
            cancelQueuetem();
          }
        });
        ui.showSignInForm();
      }
    }).catch(function(error) {
      ui.showErrorMessage(error);
    });
  } else {
    cancelQueuetem();
  }

}

function showJoinQueueModal() {
  $("#newCustomerName").val("");
  authenticator.requestGoogleSignInStatus().then(function(isSignedIn) {
    if ($("#newCustomerName").val() == "") {
      var userName = authenticator.getGoogleUser().getBasicProfile().getName()
      $("#newCustomerName").val(userName);
    }
  });

  if (queue && queue.textNotificationsEnabled) {
    $("#phoneNumberContainer").removeClass("hide");
  } else {
    $("#phoneNumberContainer").addClass("hide");
  }

  $("#joinQueueModal").openModal();
  $("#newCustomerName").focus();
  tracking.trackEvent(tracking.CATEGORY_WEBAPP, "Show join queue modal", queue.name, queue.key.id);
}

function onJoinQueueModalSubmitted() {
  try {
    var name = $("#newCustomerName").val();
    var hideName = $("#newCustomerVisibility").prop("checked") == false;
    var phoneNumber = $("#phoneNumber").val();

    Materialize.toast(getString("joiningQueue"), 3000);
    var request = intelliqApi.addQueueItem(queue.key.id)
        .withName(name)
        .hideName(hideName)
        .withPhoneNumber(phoneNumber)
        .usingApp(true);

    if (authenticator.getGoogleSignInStatus()) {
      request.setGoogleIdToken(authenticator.getGoogleUserIdToken());
    }

    request.send().then(function(data){
      try {
        console.log(data);
        var queueItems = intelliqApi.getQueueItemsFromResponse(data);
        if (queueItems.length < 1) {
          throw "Queue item not found";
        }
        queueItem = queueItems[0];
        onQueueJoined(queueItem);
        tracking.trackEvent(tracking.CATEGORY_WEBAPP, "Queue joined", queue.name, queue.key.id);

        // update url
        var url = intelliqApi.getUrls().forQueue(queue).openInWebApp();
        url = intelliqApi.getUrls().replaceParameter("queueItemKeyId", queueItem.key.id, url);
        window.history.pushState(null, "Ticket", url);
      } catch(error) {
        console.log(error);
        ui.showErrorMessage(error);
      }
    }).catch(function(error){
      console.log(error);
      ui.showErrorMessage(error);
    });

    $("#joinQueueModal").closeModal();
    tracking.trackEvent(tracking.CATEGORY_WEBAPP, "Submit join queue modal", queue.name, queue.key.id);
    if (phoneNumber && phoneNumber.length > 0) {
      tracking.trackEvent(tracking.CATEGORY_WEBAPP, "Phone number provided by user", phoneNumber);
    }
  } catch(error) {
    console.log(error);
    ui.showErrorMessage(error);
  }
}

function onQueueJoined(queueItem) {
  // set cookies
  setCookie("queueKeyId", queueItem.queueKeyId);
  setCookie("queueItemKeyId", queueItem.key.id);
  setCookie("queueItem", JSON.stringify(queueItem));

  $("#joinQueueContainer").addClass("hide");
  $("#joinQueueButton").addClass("disabled");
  $("#leaveQueueContainer").removeClass("hide");
  $("#leaveQueueButton").removeClass("disabled");

  onQueueItemsChanged();
}

function onQueueLeft() {
  // delete cookies
  deleteCookie("queueKeyId");
  deleteCookie("queueItemKeyId");
  deleteCookie("queueItem");

  $("#joinQueueContainer").removeClass("hide");
  $("#joinQueueButton").removeClass("disabled");
  $("#leaveQueueContainer").addClass("hide");
  $("#leaveQueueButton").addClass("disabled");

  onQueueItemsChanged();
}