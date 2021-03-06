var tracking = function(){

  function log(message) {
    if (typeof message !== "string") {
      message = "\n" + JSON.stringify(message, null, 2)
    }
    console.log("Tracking: " + message);
  }

  var tracking = {
  };

  // tracking categories
  tracking.CATEGORY_QUEUE_MANAGE = "Manage Queue";
  tracking.CATEGORY_QUEUE_EDIT = "Edit Queue";
  tracking.CATEGORY_BUSINESS_MANAGE = "Manage Business";
  tracking.CATEGORY_BUSINESS_EDIT = "Edit Business";
  tracking.CATEGORY_WEBAPP = "Web App";
  
  // for opt-out
  tracking.enabled = true;

  tracking.trackEvent = function(category, action, label, value) {
    if (!tracking.enabled) {
      return;
    }
    var fields = {
      hitType: "event",
      eventCategory: category,
      eventAction: action,
      eventLabel: label,
      eventValue: value
    }
    ga("send", fields);
    log("Tracked event: " + category + ", " + action + ", " + label + ", " + value);
  }

  tracking.trackException = function(description, fatal) {
    if (!tracking.enabled) {
      return;
    }
    var fields = {
      "exDescription": description,
      "exFatal": fatal
    }
    ga('send', 'exception', fields);
    log("Tracked exception: " + description + ", " + fatal);
  }

  return tracking;
}();