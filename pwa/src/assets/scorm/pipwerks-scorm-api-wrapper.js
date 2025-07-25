var pipwerks = {
  SCORM: {
    version: "1.2",
    handleCompletionStatus: true,
    API: null,
    initialized: false,

    init: function () {
      var API = this.getAPI();
      if (!API) {
        console.warn("SCORM API not found.");
        return false;
      }
      this.API = API;
      var result = API.LMSInitialize("");
      this.initialized = result === "true";

      // On init, try to resume suspend_data from localStorage
      if (this.initialized) {
        const resumeData = localStorage.getItem('scorm_suspend_data');
        if (resumeData) {
          this.API.LMSSetValue('cmi.suspend_data', resumeData);
        }
      }

      return this.initialized;
    },

    getAPI: function () {
      // Use the injected API from the iframe window
      return window.API_12 || null;
    },

    get: function (parameter) {
      if (!this.initialized) return null;
      var value = this.API.LMSGetValue(parameter);
      return value;
    },

    set: function (parameter, value) {
      if (!this.initialized) return false;

      // Also store suspend_data in localStorage
      if (parameter === 'cmi.suspend_data') {
        localStorage.setItem('scorm_suspend_data', value);
      }

      var result = this.API.LMSSetValue(parameter, value);
      return result === "true";
    },

    save: function () {
      if (!this.initialized) return false;
      var result = this.API.LMSCommit("");
      return result === "true";
    },

    finish: function () {
      if (!this.initialized) return false;
      var result = this.API.LMSFinish("");
      this.initialized = false;
      return result === "true";
    },
  }
};

// Global object to collect SCORM data
var scormTrackingData = {};

// Load resume data from localStorage
const storedSuspendData = localStorage.getItem('scorm_suspend_data');
if (storedSuspendData) {
  scormTrackingData['cmi.suspend_data'] = storedSuspendData;
}

window.API = {
  LMSInitialize: function () {
    console.log("LMSInitialize called");
    return "true";
  },
  LMSGetValue: function (param) {
    console.log("LMSGetValue called", param);
    return scormTrackingData[param] || "";
  },
  LMSSetValue: function (param, value) {
    console.log("LMSSetValue called", param, value);
    scormTrackingData[param] = value;

    // Save suspend_data to localStorage when set
    if (param === 'cmi.suspend_data') {
      localStorage.setItem('scorm_suspend_data', value);
    }

    return "true";
  },
  LMSCommit: function () {
    console.log("LMSCommit called");
    if (window.parent && window.parent.postMessage) {
      window.parent.postMessage({
        type: 'SCORM_COMMIT',
        data: scormTrackingData
      }, '*');
    }
    return "true";
  },
  LMSFinish: function () {
    console.log("LMSFinish called");
    return "true";
  },
  LMSGetLastError: function () {
    return "0";
  },
  LMSGetErrorString: function (errorCode) {
    const errorStrings = {
      "0": "No error",
      "101": "General Exception",
      "201": "Invalid argument error",
      "202": "Element cannot have children",
      "203": "Element not an array. Cannot have count.",
    };
    return errorStrings[errorCode] || "Unknown error";
  },
  LMSGetDiagnostic: function (errorCode) {
    return "Diagnostic info for error code " + errorCode;
  }
};
