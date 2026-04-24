/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Code/Code.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const CodeProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Mode",
    "name": "mode",
    "type": "options",
    "noDataExpression": true,
    "options": [
      {
        "name": "Run Once for All Items",
        "value": "runOnceForAllItems",
        "description": "Run this code only once, no matter how many input items there are"
      },
      {
        "name": "Run Once for Each Item",
        "value": "runOnceForEachItem",
        "description": "Run this code as many times as there are input items"
      }
    ],
    "default": "runOnceForAllItems"
  },
  {
    "displayName": "Language",
    "name": "language",
    "type": "options",
    "noDataExpression": true,
    "displayOptions": {
      "show": {
        "@version": [
          2
        ]
      }
    },
    "options": [
      {
        "name": "JavaScript",
        "value": "javaScript"
      },
      {
        "name": "Python (Beta)",
        "value": "python"
      }
    ],
    "default": "javaScript"
  },
  {
    "displayName": "Language",
    "name": "language",
    "type": "hidden",
    "displayOptions": {
      "show": {
        "@version": [
          1
        ]
      }
    },
    "default": "javaScript"
  },
  {
    "displayName": "JavaScript",
    "name": "jsCode",
    "type": "string",
    "typeOptions": {
      "editor": "codeNodeEditor",
      "editorLanguage": "javaScript"
    },
    "default": "",
    "description": "JavaScript code to execute.<br><br>Tip: You can use luxon vars like <code>$today</code> for dates and <code>$jmespath</code> for querying JSON structures. <a href=\"https://docs.n8n.io/nodes/n8n-nodes-base.function\">Learn more</a>.",
    "noDataExpression": true,
    "displayOptions": {
      "show": {
        "@version": [
          1
        ],
        "mode": [
          "runOnceForAllItems"
        ]
      }
    }
  },
  {
    "displayName": "JavaScript",
    "name": "jsCode",
    "type": "string",
    "typeOptions": {
      "editor": "codeNodeEditor",
      "editorLanguage": "javaScript"
    },
    "default": "",
    "description": "JavaScript code to execute.<br><br>Tip: You can use luxon vars like <code>$today</code> for dates and <code>$jmespath</code> for querying JSON structures. <a href=\"https://docs.n8n.io/nodes/n8n-nodes-base.function\">Learn more</a>.",
    "noDataExpression": true,
    "displayOptions": {
      "show": {
        "@version": [
          1
        ],
        "mode": [
          "runOnceForEachItem"
        ]
      }
    }
  },
  {
    "displayName": "JavaScript",
    "name": "jsCode",
    "type": "string",
    "typeOptions": {
      "editor": "codeNodeEditor",
      "editorLanguage": "javaScript"
    },
    "default": "",
    "description": "JavaScript code to execute.<br><br>Tip: You can use luxon vars like <code>$today</code> for dates and <code>$jmespath</code> for querying JSON structures. <a href=\"https://docs.n8n.io/nodes/n8n-nodes-base.function\">Learn more</a>.",
    "noDataExpression": true,
    "displayOptions": {
      "show": {
        "@version": [
          2
        ],
        "language": [
          "javaScript"
        ],
        "mode": [
          "runOnceForAllItems"
        ]
      }
    }
  },
  {
    "displayName": "JavaScript",
    "name": "jsCode",
    "type": "string",
    "typeOptions": {
      "editor": "codeNodeEditor",
      "editorLanguage": "javaScript"
    },
    "default": "",
    "description": "JavaScript code to execute.<br><br>Tip: You can use luxon vars like <code>$today</code> for dates and <code>$jmespath</code> for querying JSON structures. <a href=\"https://docs.n8n.io/nodes/n8n-nodes-base.function\">Learn more</a>.",
    "noDataExpression": true,
    "displayOptions": {
      "show": {
        "@version": [
          2
        ],
        "language": [
          "javaScript"
        ],
        "mode": [
          "runOnceForEachItem"
        ]
      }
    }
  },
  {
    "displayName": "Type <code>$</code> for a list of <a target=\"_blank\" href=\"https://docs.n8n.io/code-examples/methods-variables-reference/\">special vars/methods</a>. Debug by using <code>console.log()</code> statements and viewing their output in the browser console.",
    "name": "notice",
    "type": "notice",
    "displayOptions": {
      "show": {
        "language": [
          "javaScript"
        ]
      }
    },
    "default": ""
  },
  {
    "displayName": "Python",
    "name": "pythonCode",
    "type": "string",
    "typeOptions": {
      "editor": "codeNodeEditor",
      "editorLanguage": "python"
    },
    "default": "",
    "description": "Python code to execute.<br><br>Tip: You can use luxon vars like <code>_today</code> for dates and <code>$_mespath</code> for querying JSON structures. <a href=\"https://docs.n8n.io/nodes/n8n-nodes-base.function\">Learn more</a>.",
    "noDataExpression": true,
    "displayOptions": {
      "show": {
        "language": [
          "python"
        ],
        "mode": [
          "runOnceForAllItems"
        ]
      }
    }
  },
  {
    "displayName": "Python",
    "name": "pythonCode",
    "type": "string",
    "typeOptions": {
      "editor": "codeNodeEditor",
      "editorLanguage": "python"
    },
    "default": "",
    "description": "Python code to execute.<br><br>Tip: You can use luxon vars like <code>_today</code> for dates and <code>$_mespath</code> for querying JSON structures. <a href=\"https://docs.n8n.io/nodes/n8n-nodes-base.function\">Learn more</a>.",
    "noDataExpression": true,
    "displayOptions": {
      "show": {
        "language": [
          "python"
        ],
        "mode": [
          "runOnceForEachItem"
        ]
      }
    }
  },
  {
    "displayName": "Debug by using <code>print()</code> statements and viewing their output in the browser console.",
    "name": "notice",
    "type": "notice",
    "displayOptions": {
      "show": {
        "language": [
          "python"
        ]
      }
    },
    "default": ""
  },
  {
    "displayName": "Python Modules",
    "name": "modules",
    "displayOptions": {
      "show": {
        "language": [
          "python"
        ]
      }
    },
    "type": "string",
    "default": "",
    "placeholder": "opencv-python",
    "description": "Comma-separated list of Python modules to load. They have to be installed to be able to be loaded and imported.",
    "noDataExpression": true
  }
];
