document.addEventListener("deviceready", onDeviceReady, false);

function onDeviceReady() {
  checkBluetooth();
  $("body").on("click", "#sender-button", function () {
    showSenderPage();
  });

  $("body").on("click", "#receiver-button", function () {
    showReceiverPage();
  });

  $("body").on("click", ".connect-button", function () {
    var uuid = "94f39d29-7d6d-437d-973b-fba39e49d4ee";

    networking.bluetooth.connect(
      this.id,
      uuid,
      function (socketId) {
        console.log(socketId)
      },
      function (errorMessage) {
        console.log("Connection failed: " + errorMessage);
      }
    );
  });
}

function checkBluetooth() {
  networking.bluetooth.getAdapterState(
    function (adapterInfo) {
      if (adapterInfo.enabled) {
        checkAuthorization();
      } else {
        requestBluetooth();
      }
    },
    function () {
      $("#dialog-header").html("Bluetooth required!");
      $("#dialog-content").html(
        "Please ensure that you have turned on bluetooth. Otherwise application will not work"
      );
      $("#dialog-overlay").show();
      $("body").on("click", "#dialog-ok-button", function () {
        $("#dialog-overlay").hide();
        $("body").off("click", "#dialog-ok-button");
        checkBluetooth();
      });
    }
  );
}

function requestBluetooth() {
  networking.bluetooth.requestEnable(
    function () {
      checkAuthorization();
    },
    function () {
      $("#dialog-header").html("Bluetooth required!");
      $("#dialog-content").html(
        "Please ensure that you have turned on bluetooth. Otherwise application will not work"
      );
      $("#dialog-overlay").show();
      $("body").on("click", "#dialog-ok-button", function () {
        $("#dialog-overlay").hide();
        $("body").off("click", "#dialog-ok-button");
        checkBluetooth();
      });
    }
  );
}

function showDeviceTypePage() {
  $("#receiver-page").hide();
  $("#sender-page").hide();
  $("#device-type-page").show();
}

function showReceiverPage() {
  $("#receiver-page").show();
  $("#sender-page").hide();
  $("#device-type-page").hide();
  requestDiscoverable();
}

function showSenderPage() {
  $("#receiver-page").hide();
  $("#sender-page").show();
  $("#device-type-page").hide();
  detectDevices();
}

function detectDevices() {
  $("#refresh-devices-list").addClass("disabled");
  $("#devices-list").empty();
  var device_names = {};
  var updateDeviceName = function (device) {
    device_names[device.address] = device.name;
    if (device.name) {
      $("#devices-list").append(
        $(
          '<li><div class="device-row"><div class="device-name">' +
            device.name +
            '</div><div class="connect-button-wrapper"><div class="button connect-button" id="' +
            device.address +
            '"><div class="button-inner">Connect</div></div></div></div></li>'
        )
      );
    } else {
      $("#devices-list").append(
        $(
          '<li><div class="device-row"><div class="device-name">Unknown</div><div class="connect-button-wrapper"><div class="button connect-button" id="' +
            device.address +
            '"><div class="button-inner">Connect</div></div></div></div></li>'
        )
      );
    }
  };

  // Add listener to receive newly found devices
  networking.bluetooth.onDeviceAdded.addListener(updateDeviceName);

  // With the listener in place, get the list of known devices
  networking.bluetooth.getDevices(function (devices) {
    for (var i = 0; i < devices.length; i++) {
      updateDeviceName(devices[i]);
    }
  });

  // Now begin the discovery process.
  networking.bluetooth.startDiscovery(
    function () {
      // Stop discovery after 10 seconds.
      setTimeout(function () {
        networking.bluetooth.stopDiscovery();
        networking.bluetooth.onDeviceAdded.removeListener(updateDeviceName);
        $("#refresh-devices-list").removeClass("disabled");
      }, 10000);
    },
    function (err) {
      networking.bluetooth.stopDiscovery();
      networking.bluetooth.onDeviceAdded.removeListener(updateDeviceName);
      $("#refresh-devices-list").removeClass("disabled");
    }
  );
}

function evaluateAuthorizationStatus(status) {
  switch (status) {
    case cordova.plugins.diagnostic.permissionStatus.NOT_REQUESTED:
      console.log("Permission not requested");
      requestAuthorization();
      break;
    case cordova.plugins.diagnostic.permissionStatus.DENIED:
      console.log("Permission denied");
      requestAuthorization();
      break;
    case cordova.plugins.diagnostic.permissionStatus.DENIED_ALWAYS:
      console.log("Permission permanently denied");
      navigator.notification.confirm(
        "This app has been denied access to your location and it really needs it function properly. Would you like to switch to the app settings page to allow access?",
        function (i) {
          if (i === 1) {
            cordova.plugins.diagnostic.switchToSettings();
          }
        },
        "Location access denied",
        ["Yes", "No"]
      );
      break;
    case cordova.plugins.diagnostic.permissionStatus.GRANTED:
    case cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE:
      checkGeolocation();
      break;
  }
}

function requestAuthorization() {
  cordova.plugins.diagnostic.requestLocationAuthorization(
    evaluateAuthorizationStatus,
    checkAuthorization
  );
}

function checkAuthorization() {
  cordova.plugins.diagnostic.getLocationAuthorizationStatus(
    evaluateAuthorizationStatus,
    checkAuthorization
  );
}

function checkGeolocation() {
  cordova.plugins.locationAccuracy.request(
    function () {
      showDeviceTypePage();
    },
    function () {
      $("#dialog-header").html("Location required!");
      $("#dialog-content").html(
        "Please ensure that you have turned on location. Otherwise application will not work"
      );
      $("#dialog-overlay").show();
      $("body").on("click", "#dialog-ok-button", function () {
        $("#dialog-overlay").hide();
        $("body").off("click", "#dialog-ok-button");
        checkGeolocation();
      });
    },
    cordova.plugins.locationAccuracy.REQUEST_PRIORITY_HIGH_ACCURACY
  );
}

function requestDiscoverable() {
  networking.bluetooth.requestDiscoverable(
    function () {
      // The device is now discoverable
    },
    function () {
      $("#dialog-header").html("Discoverable required!");
      $("#dialog-content").html(
        "Please ensure that you have allowed device to be discoverable. Otherwise application will not work"
      );
      $("#dialog-overlay").show();
      $("body").on("click", "#dialog-ok-button", function () {
        $("#dialog-overlay").hide();
        $("body").off("click", "#dialog-ok-button");
        checkDiscoverable();
      });
    }
  );
}
