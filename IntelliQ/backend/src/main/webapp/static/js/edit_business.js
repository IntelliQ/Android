var existingBusiness; // holds the existing business, as returned by the API
var newBusiness; // holds the new business, created by the local changes

(function($){
  $(function(){
    $("#saveBusinessButton").click(saveNewBusiness);
    updateFormWithUrlParameterData();

    setupImageUpload();

    var statusChangeListener = {
      onUserAvailable: function(user) {
        var businessKeyId = getUrlParam("businessKeyId");
        requestExistingBusinessData(businessKeyId);

        // update the UI
        if (businessKeyId == null) {
          showAddBusinessUi();
        } else {
          showEditBusinessUi();
        }
      }
    };
    authenticator.registerStatusChangeListener(statusChangeListener);
  });
})(jQuery);

// fetches an existing business from the API, if the required
// url param is set. Then updates the form with the business data
function requestExistingBusinessData(businessKeyId) {
  if (businessKeyId == null) {
    console.log("No business key ID specified");
    $(".loadingState").hide();
    return;
  }

  intelliqApi.getBusiness(businessKeyId).send().then(function(data){
    var businesses = intelliqApi.getBusinessesFromResponse(data);
    existingBusiness = businesses[0];
    console.log(existingBusiness);
    $(".loadingState").hide();
    updateFormWithBusinessData(existingBusiness);
  }).catch(function(error){
    console.log(error);
    $(".loadingState").hide();
    ui.showErrorMessage(error);
  });
}

function showAddBusinessUi() {
  $("#businessHeading").text(getString("addBusiness"));
  $("#saveBusinessButton").text(getString("save"));
  $("#changeImageContainer").addClass("hide");
}

function showEditBusinessUi() {
  $("#businessHeading").text(getString("editBusiness"));
  $("#saveBusinessButton").text(getString("applyChanges"));
  $("#changeImageContainer").removeClass("hide");
}

// fills the form fields with data from URL params
function updateFormWithUrlParameterData() {
  $("#form-name").val(getDecodedUrlParam("name"));
  $("#form-mail").val(getDecodedUrlParam("mail"));
}

// fills the form fields with data from the passed business
function updateFormWithBusinessData(business) {
  if (business == null) {
    console.log("Can't update form, passed business is invalid");
    return;
  }

  console.log("Updating form with data from business: " + business.name);

  $("#form-key-id").val(business.key.id);
  $("#form-name").val(business.name);
  $("#form-mail").val(business.mail);

  $("#changeImageButton").removeClass("disabled");
}

// creates a new business object by parsing the form data
function parseFormToBusiness() {
  var parsedBusiness = {};
  parsedBusiness.name = $("#form-name").val();
  parsedBusiness.mail = $("#form-mail").val();
  return parsedBusiness;
}

// applies the changes that have been made to the business
function saveNewBusiness() {
  console.log("Saving new business");
  newBusiness = parseFormToBusiness();
  var mergedBusiness = mergeBusinesses(existingBusiness, newBusiness);
  console.log(mergedBusiness);

  var promise;
  if (mergedBusiness.key != null) {
    promise = updateExistingBusiness(mergedBusiness);
  } else {
    promise = addNewBusiness(mergedBusiness);
  }

  promise.then(function(data) {
    console.log(data);
    window.location.href = intelliqApi.PAGE_LINK_MANAGE;
  }, function(error) {
    ui.showErrorMessage(error);
  });
}

function updateExistingBusiness(business) {
  var googleIdToken = authenticator.getGoogleUserIdToken();
  return intelliqApi
      .editBusiness(business.key.id, business.name, business.mail)
      .setGoogleIdToken(googleIdToken)
      .send();
}

function addNewBusiness(business) {
  var googleIdToken = authenticator.getGoogleUserIdToken();
  return intelliqApi
      .addBusiness(business.name, business.mail)
      .addQueue(false)
      .setGoogleIdToken(googleIdToken)
      .send();
}

// merges two businesses by returning the existing business with
// values overwritten by the new business
function mergeBusinesses(existingBusiness, newBusiness) {
  if (existingBusiness == null) {
    return newBusiness;
  }
  for (var key in newBusiness) {
    if (newBusiness.hasOwnProperty(key)) {
      existingBusiness[key] = newBusiness[key];
    }
  }
  return existingBusiness;
}

function setupImageUpload() {
  $("#changeImageButton").click(function() {
    $("#imageUploadModal").openModal();
  });

  var imageFileInput = $("#imageFileInput").get(0);
  imageFileInput.addEventListener('change', function(event) {
    var businessKeyId = existingBusiness.key.id;
    var files = $("#imageFileInput").get(0).files;
    if (files.length < 1) {
      return;
    }

    var file = files[0];

    Materialize.toast(getString("uploadStarted"), 3000);
    $(".loadingState").show();

    intelliqApi.uploadBusinessLogo(businessKeyId, file, authenticator.getGoogleUserIdToken()).then(function(data){
      Materialize.toast(getString("uploadSuccessful"), 3000);
      $(".loadingState").hide();
      $("#imageUploadModal").closeModal();
    }).catch(function(error){
      console.log(error);
      Materialize.toast(getString("uploadFailed"), 3000);
      ui.showErrorMessage(error);
      $(".loadingState").hide();
    });
  });
}