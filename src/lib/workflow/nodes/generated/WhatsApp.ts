/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/WhatsApp/WhatsApp.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const WhatsAppProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Resource",
    "name": "resource",
    "type": "options",
    "noDataExpression": true,
    "options": [
      {
        "name": "Message",
        "value": "message"
      },
      {
        "name": "Media",
        "value": "media"
      }
    ],
    "default": "message"
  },
  {
    "displayName": "Operation",
    "noDataExpression": true,
    "name": "operation",
    "type": "options",
    "placeholder": "",
    "options": [
      {
        "name": "Send",
        "value": "send",
        "action": "Send message"
      },
      {
        "name": "Send Template",
        "value": "sendTemplate",
        "action": "Send template"
      }
    ],
    "default": "sendTemplate",
    "routing": {
      "request": {
        "ignoreHttpStatusErrors": true
      },
      "send": {
        "preSend": [
          null
        ]
      },
      "output": {
        "postReceive": [
          null
        ]
      }
    },
    "displayOptions": {
      "show": {
        "resource": [
          "message"
        ]
      }
    }
  },
  {
    "displayName": "Messaging Product",
    "name": "messagingProduct",
    "default": "whatsapp",
    "type": "hidden",
    "routing": {
      "send": {
        "type": "body",
        "property": "messaging_product"
      }
    },
    "displayOptions": {
      "show": {
        "resource": [
          "message"
        ]
      }
    }
  },
  {
    "displayName": "Sender Phone Number (or ID)",
    "name": "phoneNumberId",
    "type": "options",
    "typeOptions": {
      "loadOptions": {
        "routing": {
          "request": {
            "url": "={{$credentials.businessAccountId}}/phone_numbers",
            "method": "GET"
          },
          "output": {
            "postReceive": [
              {
                "type": "rootProperty",
                "properties": {
                  "property": "data"
                }
              },
              {
                "type": "setKeyValue",
                "properties": {
                  "name": "={{$responseItem.display_phone_number}} - {{$responseItem.verified_name}}",
                  "value": "={{$responseItem.id}}"
                }
              },
              {
                "type": "sort",
                "properties": {
                  "key": "name"
                }
              }
            ]
          }
        }
      }
    },
    "default": "",
    "placeholder": "",
    "required": true,
    "description": "The ID of the business account's phone number from which the message will be sent from",
    "routing": {
      "request": {
        "method": "POST",
        "url": "={{$value}}/messages"
      }
    },
    "displayOptions": {
      "show": {
        "resource": [
          "message"
        ]
      }
    }
  },
  {
    "displayName": "Recipient's Phone Number",
    "name": "recipientPhoneNumber",
    "type": "string",
    "default": "",
    "required": true,
    "description": "Phone number of the recipient of the message",
    "hint": "When entering a phone number, make sure to include the country code",
    "routing": {
      "send": {
        "type": "body",
        "preSend": [
          null
        ]
      }
    },
    "displayOptions": {
      "show": {
        "resource": [
          "message"
        ]
      }
    }
  },
  {
    "displayName": "MessageType",
    "noDataExpression": true,
    "name": "messageType",
    "type": "options",
    "placeholder": "",
    "options": [
      {
        "name": "Audio",
        "value": "audio"
      },
      {
        "name": "Contacts",
        "value": "contacts"
      },
      {
        "name": "Document",
        "value": "document"
      },
      {
        "name": "Image",
        "value": "image"
      },
      {
        "name": "Location",
        "value": "location"
      },
      {
        "name": "Text",
        "value": "text"
      },
      {
        "name": "Video",
        "value": "video"
      }
    ],
    "default": "text",
    "description": "The type of the message",
    "displayOptions": {
      "show": {
        "resource": [
          "message"
        ],
        "operation": [
          "send"
        ]
      }
    }
  },
  {
    "displayName": "Operation",
    "name": "operation",
    "noDataExpression": true,
    "type": "options",
    "placeholder": "",
    "options": [
      {
        "name": "Upload",
        "value": "mediaUpload",
        "action": "Upload media"
      },
      {
        "name": "Download",
        "value": "mediaUrlGet",
        "action": "Download media"
      },
      {
        "name": "Delete",
        "value": "mediaDelete",
        "action": "Delete media"
      }
    ],
    "default": "mediaUpload",
    "displayOptions": {
      "show": {
        "resource": [
          "media"
        ]
      }
    },
    "description": "The operation to perform on the media"
  },
  {
    "displayName": "Name",
    "name": "name",
    "type": "fixedCollection",
    "typeOptions": {
      "multipleValues": false
    },
    "displayOptions": {
      "show": {
        "operation": [
          "send"
        ],
        "messageType": [
          "contacts"
        ]
      }
    },
    "placeholder": "Add Parameter",
    "default": {},
    "options": [
      {
        "displayName": "Name",
        "name": "data",
        "values": [
          {
            "displayName": "Formatted Name",
            "name": "formatted_name",
            "type": "string",
            "required": true,
            "default": "",
            "routing": {
              "send": {
                "type": "body",
                "property": "contacts[0].name.formatted_name"
              }
            }
          },
          {
            "displayName": "First Name",
            "name": "first_name",
            "type": "string",
            "default": "",
            "routing": {
              "send": {
                "type": "body",
                "property": "contacts[0].name.first_name"
              }
            }
          },
          {
            "displayName": "Last Name",
            "name": "last_name",
            "type": "string",
            "default": "",
            "routing": {
              "send": {
                "type": "body",
                "property": "contacts[0].name.last_name"
              }
            }
          },
          {
            "displayName": "Middle Name",
            "name": "middle_name",
            "type": "string",
            "default": "",
            "routing": {
              "send": {
                "type": "body",
                "property": "contacts[0].name.middle_name"
              }
            }
          },
          {
            "displayName": "Suffix",
            "name": "suffix",
            "type": "string",
            "default": "",
            "routing": {
              "send": {
                "type": "body",
                "property": "contacts[0].name.suffix"
              }
            }
          },
          {
            "displayName": "Prefix",
            "name": "prefix",
            "type": "string",
            "default": "",
            "routing": {
              "send": {
                "type": "body",
                "property": "contacts[0].name.prefix"
              }
            }
          }
        ]
      }
    ]
  },
  {
    "displayName": "Additional Fields",
    "name": "additionalFields",
    "type": "collection",
    "placeholder": "Add Field",
    "default": {},
    "displayOptions": {
      "show": {
        "operation": [
          "send"
        ],
        "messageType": [
          "contacts"
        ]
      }
    },
    "options": [
      {
        "displayName": "Addresses",
        "name": "addresses",
        "type": "fixedCollection",
        "typeOptions": {
          "multipleValues": true
        },
        "placeholder": "Add Parameter",
        "default": {},
        "options": [
          {
            "displayName": "Address",
            "name": "address",
            "values": [
              {
                "displayName": "Type",
                "name": "type",
                "type": "options",
                "options": [
                  {
                    "name": "Home",
                    "value": "HOME"
                  },
                  {
                    "name": "Work",
                    "value": "WORK"
                  }
                ],
                "default": "HOME",
                "routing": {
                  "send": {
                    "property": "=contacts[0].addresses[{{$index}}].type",
                    "type": "body"
                  }
                }
              },
              {
                "displayName": "Street",
                "name": "street",
                "type": "string",
                "default": "",
                "routing": {
                  "send": {
                    "property": "=contacts[0].addresses[{{$index}}].street",
                    "type": "body"
                  }
                }
              },
              {
                "displayName": "City",
                "name": "city",
                "type": "string",
                "default": "",
                "routing": {
                  "send": {
                    "property": "=contacts[0].addresses[{{$index}}].city",
                    "type": "body"
                  }
                }
              },
              {
                "displayName": "State",
                "name": "state",
                "type": "string",
                "default": "",
                "routing": {
                  "send": {
                    "property": "=contacts[0].addresses[{{$index}}].state",
                    "type": "body"
                  }
                }
              },
              {
                "displayName": "Zip",
                "name": "zip",
                "type": "string",
                "default": "",
                "routing": {
                  "send": {
                    "property": "=contacts[0].addresses[{{$index}}].zip",
                    "type": "body"
                  }
                }
              },
              {
                "displayName": "Country",
                "name": "country",
                "type": "string",
                "default": "",
                "routing": {
                  "send": {
                    "property": "=contacts[0].addresses[{{$index}}].country",
                    "type": "body"
                  }
                }
              },
              {
                "displayName": "Country Code",
                "name": "country_code",
                "type": "string",
                "default": "",
                "routing": {
                  "send": {
                    "property": "=contacts[0].addresses[{{$index}}].country_code",
                    "type": "body"
                  }
                }
              }
            ]
          }
        ]
      },
      {
        "displayName": "Birthday",
        "name": "birthday",
        "type": "string",
        "default": "",
        "routing": {
          "send": {
            "property": "contacts[0].birthday",
            "type": "body"
          }
        },
        "placeholder": "YYYY-MM-DD"
      },
      {
        "displayName": "Emails",
        "name": "emails",
        "type": "fixedCollection",
        "typeOptions": {
          "multipleValues": true
        },
        "placeholder": "Add Parameter",
        "default": {},
        "options": [
          {
            "displayName": "Email",
            "name": "data",
            "values": [
              {
                "displayName": "Type",
                "name": "type",
                "type": "options",
                "options": [
                  {
                    "name": "Home",
                    "value": "HOME"
                  },
                  {
                    "name": "Work",
                    "value": "WORK"
                  }
                ],
                "default": "HOME",
                "routing": {
                  "send": {
                    "property": "=contacts[0].emails[{{$index}}].type",
                    "type": "body"
                  }
                }
              },
              {
                "displayName": "Email",
                "name": "email",
                "type": "string",
                "placeholder": "name@email.com",
                "default": "",
                "routing": {
                  "send": {
                    "property": "=contacts[0].emails[{{$index}}].email",
                    "type": "body"
                  }
                }
              }
            ]
          }
        ]
      },
      {
        "displayName": "Organization",
        "name": "organization",
        "type": "fixedCollection",
        "typeOptions": {
          "multipleValues": false
        },
        "placeholder": "Add Parameter",
        "default": {},
        "options": [
          {
            "displayName": "Organization",
            "name": "data",
            "values": [
              {
                "displayName": "Company",
                "name": "company",
                "type": "string",
                "default": "",
                "routing": {
                  "send": {
                    "type": "body",
                    "property": "contacts[0].org.company"
                  }
                }
              },
              {
                "displayName": "Department",
                "name": "department",
                "type": "string",
                "default": "",
                "routing": {
                  "send": {
                    "type": "body",
                    "property": "contacts[0].org.department"
                  }
                }
              },
              {
                "displayName": "Title",
                "name": "title",
                "type": "string",
                "default": "",
                "routing": {
                  "send": {
                    "type": "body",
                    "property": "contacts[0].org.title"
                  }
                }
              }
            ]
          }
        ]
      },
      {
        "displayName": "Phones",
        "name": "phones",
        "type": "fixedCollection",
        "typeOptions": {
          "multipleValues": true
        },
        "placeholder": "Add Parameter",
        "default": {},
        "options": [
          {
            "displayName": "Phone",
            "name": "data",
            "values": [
              {
                "displayName": "Type",
                "name": "type",
                "type": "options",
                "options": [
                  {
                    "name": "Cell",
                    "value": "CELL"
                  },
                  {
                    "name": "Home",
                    "value": "HOME"
                  },
                  {
                    "name": "Iphone",
                    "value": "IPHONE"
                  },
                  {
                    "name": "Main",
                    "value": "MAIN"
                  },
                  {
                    "name": "WhatsApp ID",
                    "value": "wa_id"
                  },
                  {
                    "name": "Work",
                    "value": "WORK"
                  }
                ],
                "default": "CELL",
                "routing": {
                  "send": {
                    "property": "=contacts[0].phones[{{$index}}].type",
                    "type": "body"
                  }
                }
              },
              {
                "displayName": "Phone",
                "name": "phone",
                "type": "string",
                "default": "",
                "routing": {
                  "send": {
                    "property": "=contacts[0].phones[{{$index}}].phone",
                    "type": "body"
                  }
                }
              }
            ]
          }
        ]
      },
      {
        "displayName": "URLs",
        "name": "urls",
        "type": "fixedCollection",
        "typeOptions": {
          "multipleValues": true
        },
        "placeholder": "Add Parameter",
        "default": {},
        "options": [
          {
            "displayName": "URL",
            "name": "url",
            "values": [
              {
                "displayName": "Type",
                "name": "type",
                "type": "options",
                "options": [
                  {
                    "name": "Home",
                    "value": "HOME"
                  },
                  {
                    "name": "Work",
                    "value": "WORK"
                  }
                ],
                "default": "HOME",
                "routing": {
                  "send": {
                    "property": "=contacts[0].urls[{{$index}}].type",
                    "type": "body"
                  }
                }
              },
              {
                "displayName": "URL",
                "name": "url",
                "type": "string",
                "default": "",
                "routing": {
                  "send": {
                    "property": "=contacts[0].urls[{{$index}}].url",
                    "type": "body"
                  }
                }
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "displayName": "Longitude",
    "name": "longitude",
    "type": "number",
    "required": true,
    "default": "",
    "typeOptions": {
      "minValue": -180,
      "maxValue": 180
    },
    "displayOptions": {
      "show": {
        "resource": [
          "message"
        ],
        "operation": [
          "send"
        ],
        "messageType": [
          "location"
        ]
      }
    },
    "routing": {
      "send": {
        "type": "body",
        "property": "location.longitude"
      }
    }
  },
  {
    "displayName": "Latitude",
    "name": "latitude",
    "type": "number",
    "default": "",
    "required": true,
    "typeOptions": {
      "minValue": -90,
      "maxValue": 90
    },
    "displayOptions": {
      "show": {
        "resource": [
          "message"
        ],
        "operation": [
          "send"
        ],
        "messageType": [
          "location"
        ]
      }
    },
    "routing": {
      "send": {
        "type": "body",
        "property": "location.latitude"
      }
    }
  },
  {
    "displayName": "Additional Fields",
    "name": "additionalFields",
    "type": "fixedCollection",
    "placeholder": "Add Field",
    "default": {},
    "displayOptions": {
      "show": {
        "resource": [
          "message"
        ],
        "operation": [
          "send"
        ],
        "messageType": [
          "location"
        ]
      }
    },
    "options": [
      {
        "displayName": "Name and Address",
        "name": "nameAndAddress",
        "values": [
          {
            "displayName": "Name",
            "name": "name",
            "type": "string",
            "default": "",
            "routing": {
              "send": {
                "type": "body",
                "property": "location.name"
              }
            }
          },
          {
            "displayName": "Address",
            "name": "address",
            "type": "string",
            "default": "",
            "routing": {
              "send": {
                "type": "body",
                "property": "location.address"
              }
            }
          }
        ]
      }
    ]
  },
  {
    "displayName": "Text Body",
    "name": "textBody",
    "type": "string",
    "required": true,
    "default": "",
    "description": "The body of the message (max 4096 characters)",
    "displayOptions": {
      "show": {
        "resource": [
          "message"
        ],
        "operation": [
          "send"
        ],
        "messageType": [
          "text"
        ]
      }
    },
    "routing": {
      "send": {
        "type": "body",
        "property": "text.body"
      }
    }
  },
  {
    "displayName": "Take Audio From",
    "name": "mediaPath",
    "type": "options",
    "default": "useMediaLink",
    "description": "Use a link, an ID, or n8n to upload an audio file",
    "options": [
      {
        "name": "Link",
        "value": "useMediaLink",
        "description": "WhatsApp will download the audio, saving you the step of uploading audio yourself"
      },
      {
        "name": "WhatsApp Media",
        "value": "useMediaId",
        "description": "If you have already uploaded the audio to WhatsApp"
      },
      {
        "name": "n8n",
        "value": "useMedian8n",
        "description": "Use binary data passed into this node"
      }
    ],
    "displayOptions": {
      "show": {
        "operation": [
          "send"
        ],
        "messageType": [
          "audio"
        ]
      }
    }
  },
  {
    "displayName": "Take Document From",
    "name": "mediaPath",
    "type": "options",
    "default": "useMediaLink",
    "description": "Use a link, an ID, or n8n to upload a document",
    "options": [
      {
        "name": "Link",
        "value": "useMediaLink",
        "description": "When using a link, WhatsApp will download the document, saving you the step of uploading document yourself"
      },
      {
        "name": "WhatsApp Media",
        "value": "useMediaId",
        "description": "You can use an ID if you have already uploaded the document to WhatsApp"
      },
      {
        "name": "n8n",
        "value": "useMedian8n",
        "description": "Upload a binary file on the item being processed in n8n"
      }
    ],
    "displayOptions": {
      "show": {
        "operation": [
          "send"
        ],
        "messageType": [
          "document"
        ]
      }
    }
  },
  {
    "displayName": "Take Image From",
    "name": "mediaPath",
    "type": "options",
    "default": "useMediaLink",
    "description": "Use a link, an ID, or n8n to upload an image",
    "options": [
      {
        "name": "Link",
        "value": "useMediaLink",
        "description": "When using a link, WhatsApp will download the image, saving you the step of uploading image yourself"
      },
      {
        "name": "WhatsApp Media",
        "value": "useMediaId",
        "description": "You can use an ID if you have already uploaded the image to WhatsApp"
      },
      {
        "name": "n8n",
        "value": "useMedian8n",
        "description": "Upload a binary file on the item being processed in n8n"
      }
    ],
    "displayOptions": {
      "show": {
        "operation": [
          "send"
        ],
        "messageType": [
          "image"
        ]
      }
    }
  },
  {
    "displayName": "Take Video From",
    "name": "mediaPath",
    "type": "options",
    "default": "useMediaLink",
    "description": "Use a link, an ID, or n8n to upload a video",
    "options": [
      {
        "name": "Link",
        "value": "useMediaLink",
        "description": "When using a link, WhatsApp will download the video, saving you the step of uploading video yourself"
      },
      {
        "name": "WhatsApp Media",
        "value": "useMediaId",
        "description": "You can use an ID if you have already uploaded the video to WhatsApp"
      },
      {
        "name": "n8n",
        "value": "useMedian8n",
        "description": "Upload a binary file on the item being processed in n8n"
      }
    ],
    "displayOptions": {
      "show": {
        "operation": [
          "send"
        ],
        "messageType": [
          "video"
        ]
      }
    }
  },
  {
    "displayName": "Link",
    "name": "mediaLink",
    "type": "string",
    "default": "",
    "description": "Link of the media to be sent",
    "displayOptions": {
      "show": {
        "operation": [
          "send"
        ],
        "messageType": [
          "image",
          "video",
          "audio",
          "sticker",
          "document"
        ],
        "mediaPath": [
          "useMediaLink"
        ]
      }
    },
    "routing": {
      "send": {
        "type": "body",
        "property": "={{$parameter[\"messageType\"]}}.link"
      }
    }
  },
  {
    "displayName": "ID",
    "name": "mediaId",
    "type": "string",
    "default": "",
    "description": "ID of the media to be sent",
    "displayOptions": {
      "show": {
        "operation": [
          "send"
        ],
        "messageType": [
          "image",
          "video",
          "audio",
          "sticker",
          "document"
        ],
        "mediaPath": [
          "useMediaId"
        ]
      }
    },
    "routing": {
      "send": {
        "type": "body",
        "property": "={{$parameter[\"messageType\"]}}.id"
      }
    }
  },
  {
    "displayName": "Input Data Field Name",
    "name": "mediaPropertyName",
    "type": "string",
    "default": "data",
    "description": "The name of the input field containing the binary file data to be uploaded",
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "send"
        ],
        "messageType": [
          "image",
          "video",
          "audio",
          "sticker",
          "document"
        ],
        "mediaPath": [
          "useMedian8n"
        ]
      }
    },
    "routing": {
      "send": {
        "preSend": [
          null
        ]
      }
    }
  },
  {
    "displayName": "Filename",
    "name": "mediaFilename",
    "type": "string",
    "default": "",
    "description": "The name of the file (required when using a file ID)",
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "send"
        ],
        "messageType": [
          "document"
        ],
        "mediaPath": [
          "useMediaId"
        ]
      }
    },
    "routing": {
      "send": {
        "type": "body",
        "property": "={{$parameter[\"messageType\"]}}.filename"
      }
    }
  },
  {
    "displayName": "Additional Fields",
    "name": "additionalFields",
    "type": "collection",
    "placeholder": "Add Field",
    "default": {},
    "displayOptions": {
      "show": {
        "resource": [
          "message"
        ],
        "operation": [
          "send"
        ],
        "messageType": [
          "image",
          "video",
          "audio",
          "sticker",
          "document"
        ]
      }
    },
    "options": [
      {
        "displayName": "Filename",
        "name": "mediaFilename",
        "type": "string",
        "default": "",
        "description": "The name of the file",
        "routing": {
          "send": {
            "type": "body",
            "property": "={{$parameter[\"messageType\"]}}.filename"
          }
        },
        "displayOptions": {
          "show": {
            "/messageType": [
              "document"
            ]
          }
        }
      },
      {
        "displayName": "Caption",
        "name": "mediaCaption",
        "type": "string",
        "default": "",
        "description": "The caption of the media",
        "routing": {
          "send": {
            "type": "body",
            "property": "={{$parameter[\"messageType\"]}}.caption"
          }
        }
      }
    ]
  },
  {
    "displayName": "Template",
    "name": "template",
    "default": "",
    "type": "options",
    "displayOptions": {
      "show": {
        "operation": [
          "sendTemplate"
        ],
        "resource": [
          "message"
        ]
      }
    },
    "typeOptions": {
      "loadOptions": {
        "routing": {
          "request": {
            "url": "={{$credentials.businessAccountId}}/message_templates",
            "method": "GET"
          },
          "output": {
            "postReceive": [
              {
                "type": "rootProperty",
                "properties": {
                  "property": "data"
                }
              },
              {
                "type": "setKeyValue",
                "properties": {
                  "name": "={{$responseItem.name}} - {{$responseItem.language}}",
                  "value": "={{$responseItem.name}}|{{$responseItem.language}}"
                }
              },
              {
                "type": "sort",
                "properties": {
                  "key": "name"
                }
              }
            ]
          }
        }
      }
    },
    "required": true,
    "description": "Name of the template",
    "routing": {
      "send": {
        "type": "body",
        "preSend": [
          null
        ]
      }
    }
  },
  {
    "displayName": "Components",
    "name": "components",
    "type": "fixedCollection",
    "default": {},
    "typeOptions": {
      "multipleValues": true
    },
    "placeholder": "Add Component",
    "displayOptions": {
      "show": {
        "operation": [
          "sendTemplate"
        ],
        "resource": [
          "message"
        ]
      }
    },
    "routing": {
      "send": {
        "preSend": [
          null
        ]
      }
    },
    "options": [
      {
        "name": "component",
        "displayName": "Component",
        "values": [
          {
            "displayName": "Type",
            "name": "type",
            "type": "options",
            "options": [
              {
                "name": "Body",
                "value": "body"
              },
              {
                "name": "Button",
                "value": "button"
              },
              {
                "name": "Header",
                "value": "header"
              }
            ],
            "default": "body"
          },
          {
            "displayName": "Parameters",
            "name": "bodyParameters",
            "type": "fixedCollection",
            "typeOptions": {
              "sortable": true,
              "multipleValues": true
            },
            "displayOptions": {
              "show": {
                "type": [
                  "body"
                ]
              }
            },
            "placeholder": "Add Parameter",
            "default": {},
            "options": [
              {
                "displayName": "Parameter",
                "name": "parameter",
                "values": [
                  {
                    "displayName": "Type",
                    "name": "type",
                    "type": "options",
                    "options": [
                      {
                        "name": "Text",
                        "value": "text"
                      },
                      {
                        "name": "Currency",
                        "value": "currency"
                      },
                      {
                        "name": "Date Time",
                        "value": "date_time"
                      }
                    ],
                    "default": "text"
                  },
                  {
                    "displayName": "Text",
                    "name": "text",
                    "type": "string",
                    "displayOptions": {
                      "show": {
                        "type": [
                          "text"
                        ]
                      }
                    },
                    "default": ""
                  },
                  {
                    "displayName": "Currency Code",
                    "name": "code",
                    "type": "options",
                    "options": [
                      {
                        "name": "AED - UAE Dirham",
                        "value": "AED"
                      },
                      {
                        "name": "AFN - Afghani",
                        "value": "AFN"
                      },
                      {
                        "name": "ALL - Lek",
                        "value": "ALL"
                      },
                      {
                        "name": "AMD - Armenian Dram",
                        "value": "AMD"
                      },
                      {
                        "name": "ANG - Netherlands Antillean Guilder",
                        "value": "ANG"
                      },
                      {
                        "name": "AOA - Kwanza",
                        "value": "AOA"
                      },
                      {
                        "name": "ARS - Argentine Peso",
                        "value": "ARS"
                      },
                      {
                        "name": "AUD - Australian Dollar",
                        "value": "AUD"
                      },
                      {
                        "name": "AWG - Aruban Florin",
                        "value": "AWG"
                      },
                      {
                        "name": "AZN - Azerbaijan Manat",
                        "value": "AZN"
                      },
                      {
                        "name": "BAM - Convertible Mark",
                        "value": "BAM"
                      },
                      {
                        "name": "BBD - Barbados Dollar",
                        "value": "BBD"
                      },
                      {
                        "name": "BDT - Taka",
                        "value": "BDT"
                      },
                      {
                        "name": "BGN - Bulgarian Lev",
                        "value": "BGN"
                      },
                      {
                        "name": "BHD - Bahraini Dinar",
                        "value": "BHD"
                      },
                      {
                        "name": "BIF - Burundi Franc",
                        "value": "BIF"
                      },
                      {
                        "name": "BMD - Bermudian Dollar",
                        "value": "BMD"
                      },
                      {
                        "name": "BND - Brunei Dollar",
                        "value": "BND"
                      },
                      {
                        "name": "BOB - Boliviano",
                        "value": "BOB"
                      },
                      {
                        "name": "BOV - Mvdol",
                        "value": "BOV"
                      },
                      {
                        "name": "BRL - Brazilian Real",
                        "value": "BRL"
                      },
                      {
                        "name": "BSD - Bahamian Dollar",
                        "value": "BSD"
                      },
                      {
                        "name": "BTN - Ngultrum",
                        "value": "BTN"
                      },
                      {
                        "name": "BWP - Pula",
                        "value": "BWP"
                      },
                      {
                        "name": "BYN - Belarusian Ruble",
                        "value": "BYN"
                      },
                      {
                        "name": "BZD - Belize Dollar",
                        "value": "BZD"
                      },
                      {
                        "name": "CAD - Canadian Dollar",
                        "value": "CAD"
                      },
                      {
                        "name": "CDF - Congolese Franc",
                        "value": "CDF"
                      },
                      {
                        "name": "CHE - WIR Euro",
                        "value": "CHE"
                      },
                      {
                        "name": "CHF - Swiss Franc",
                        "value": "CHF"
                      },
                      {
                        "name": "CHW - WIR Franc",
                        "value": "CHW"
                      },
                      {
                        "name": "CLF - Unidad de Fomento",
                        "value": "CLF"
                      },
                      {
                        "name": "CLP - Chilean Peso",
                        "value": "CLP"
                      },
                      {
                        "name": "CNY - Yuan Renminbi",
                        "value": "CNY"
                      },
                      {
                        "name": "COP - Colombian Peso",
                        "value": "COP"
                      },
                      {
                        "name": "COU - Unidad de Valor Real",
                        "value": "COU"
                      },
                      {
                        "name": "CRC - Costa Rican Colon",
                        "value": "CRC"
                      },
                      {
                        "name": "CUC - Peso Convertible",
                        "value": "CUC"
                      },
                      {
                        "name": "CUP - Cuban Peso",
                        "value": "CUP"
                      },
                      {
                        "name": "CVE - Cabo Verde Escudo",
                        "value": "CVE"
                      },
                      {
                        "name": "CZK - Czech Koruna",
                        "value": "CZK"
                      },
                      {
                        "name": "DJF - Djibouti Franc",
                        "value": "DJF"
                      },
                      {
                        "name": "DKK - Danish Krone",
                        "value": "DKK"
                      },
                      {
                        "name": "DOP - Dominican Peso",
                        "value": "DOP"
                      },
                      {
                        "name": "DZD - Algerian Dinar",
                        "value": "DZD"
                      },
                      {
                        "name": "EGP - Egyptian Pound",
                        "value": "EGP"
                      },
                      {
                        "name": "ERN - Nakfa",
                        "value": "ERN"
                      },
                      {
                        "name": "ETB - Ethiopian Birr",
                        "value": "ETB"
                      },
                      {
                        "name": "EUR - Euro",
                        "value": "EUR"
                      },
                      {
                        "name": "FJD - Fiji Dollar",
                        "value": "FJD"
                      },
                      {
                        "name": "FKP - Falkland Islands Pound",
                        "value": "FKP"
                      },
                      {
                        "name": "GBP - Pound Sterling",
                        "value": "GBP"
                      },
                      {
                        "name": "GEL - Lari",
                        "value": "GEL"
                      },
                      {
                        "name": "GHS - Ghana Cedi",
                        "value": "GHS"
                      },
                      {
                        "name": "GIP - Gibraltar Pound",
                        "value": "GIP"
                      },
                      {
                        "name": "GMD - Dalasi",
                        "value": "GMD"
                      },
                      {
                        "name": "GNF - Guinean Franc",
                        "value": "GNF"
                      },
                      {
                        "name": "GTQ - Quetzal",
                        "value": "GTQ"
                      },
                      {
                        "name": "GYD - Guyana Dollar",
                        "value": "GYD"
                      },
                      {
                        "name": "HKD - Hong Kong Dollar",
                        "value": "HKD"
                      },
                      {
                        "name": "HNL - Lempira",
                        "value": "HNL"
                      },
                      {
                        "name": "HTG - Gourde",
                        "value": "HTG"
                      },
                      {
                        "name": "HUF - Forint",
                        "value": "HUF"
                      },
                      {
                        "name": "IDR - Rupiah",
                        "value": "IDR"
                      },
                      {
                        "name": "ILS - New Israeli Sheqel",
                        "value": "ILS"
                      },
                      {
                        "name": "INR - Indian Rupee",
                        "value": "INR"
                      },
                      {
                        "name": "IQD - Iraqi Dinar",
                        "value": "IQD"
                      },
                      {
                        "name": "IRR - Iranian Rial",
                        "value": "IRR"
                      },
                      {
                        "name": "ISK - Iceland Krona",
                        "value": "ISK"
                      },
                      {
                        "name": "JMD - Jamaican Dollar",
                        "value": "JMD"
                      },
                      {
                        "name": "JOD - Jordanian Dinar",
                        "value": "JOD"
                      },
                      {
                        "name": "JPY - Yen",
                        "value": "JPY"
                      },
                      {
                        "name": "KES - Kenyan Shilling",
                        "value": "KES"
                      },
                      {
                        "name": "KGS - Som",
                        "value": "KGS"
                      },
                      {
                        "name": "KHR - Riel",
                        "value": "KHR"
                      },
                      {
                        "name": "KMF - Comorian Franc ",
                        "value": "KMF"
                      },
                      {
                        "name": "KPW - North Korean Won",
                        "value": "KPW"
                      },
                      {
                        "name": "KRW - Won",
                        "value": "KRW"
                      },
                      {
                        "name": "KWD - Kuwaiti Dinar",
                        "value": "KWD"
                      },
                      {
                        "name": "KYD - Cayman Islands Dollar",
                        "value": "KYD"
                      },
                      {
                        "name": "KZT - Tenge",
                        "value": "KZT"
                      },
                      {
                        "name": "LAK - Lao Kip",
                        "value": "LAK"
                      },
                      {
                        "name": "LBP - Lebanese Pound",
                        "value": "LBP"
                      },
                      {
                        "name": "LKR - Sri Lanka Rupee",
                        "value": "LKR"
                      },
                      {
                        "name": "LRD - Liberian Dollar",
                        "value": "LRD"
                      },
                      {
                        "name": "LSL - Loti",
                        "value": "LSL"
                      },
                      {
                        "name": "LYD - Libyan Dinar",
                        "value": "LYD"
                      },
                      {
                        "name": "MAD - Moroccan Dirham",
                        "value": "MAD"
                      },
                      {
                        "name": "MDL - Moldovan Leu",
                        "value": "MDL"
                      },
                      {
                        "name": "MGA - Malagasy Ariary",
                        "value": "MGA"
                      },
                      {
                        "name": "MKD - Denar",
                        "value": "MKD"
                      },
                      {
                        "name": "MMK - Kyat",
                        "value": "MMK"
                      },
                      {
                        "name": "MNT - Tugrik",
                        "value": "MNT"
                      },
                      {
                        "name": "MOP - Pataca",
                        "value": "MOP"
                      },
                      {
                        "name": "MRU - Ouguiya",
                        "value": "MRU"
                      },
                      {
                        "name": "MUR - Mauritius Rupee",
                        "value": "MUR"
                      },
                      {
                        "name": "MVR - Rufiyaa",
                        "value": "MVR"
                      },
                      {
                        "name": "MWK - Malawi Kwacha",
                        "value": "MWK"
                      },
                      {
                        "name": "MXN - Mexican Peso",
                        "value": "MXN"
                      },
                      {
                        "name": "MXV - Mexican Unidad de Inversion (UDI)",
                        "value": "MXV"
                      },
                      {
                        "name": "MYR - Malaysian Ringgit",
                        "value": "MYR"
                      },
                      {
                        "name": "MZN - Mozambique Metical",
                        "value": "MZN"
                      },
                      {
                        "name": "NAD - Namibia Dollar",
                        "value": "NAD"
                      },
                      {
                        "name": "NGN - Naira",
                        "value": "NGN"
                      },
                      {
                        "name": "NIO - Cordoba Oro",
                        "value": "NIO"
                      },
                      {
                        "name": "NOK - Norwegian Krone",
                        "value": "NOK"
                      },
                      {
                        "name": "NPR - Nepalese Rupee",
                        "value": "NPR"
                      },
                      {
                        "name": "NZD - New Zealand Dollar",
                        "value": "NZD"
                      },
                      {
                        "name": "OMR - Rial Omani",
                        "value": "OMR"
                      },
                      {
                        "name": "PAB - Balboa",
                        "value": "PAB"
                      },
                      {
                        "name": "PEN - Sol",
                        "value": "PEN"
                      },
                      {
                        "name": "PGK - Kina",
                        "value": "PGK"
                      },
                      {
                        "name": "PHP - Philippine Peso",
                        "value": "PHP"
                      },
                      {
                        "name": "PKR - Pakistan Rupee",
                        "value": "PKR"
                      },
                      {
                        "name": "PLN - Zloty",
                        "value": "PLN"
                      },
                      {
                        "name": "PYG - Guarani",
                        "value": "PYG"
                      },
                      {
                        "name": "QAR - Qatari Rial",
                        "value": "QAR"
                      },
                      {
                        "name": "RON - Romanian Leu",
                        "value": "RON"
                      },
                      {
                        "name": "RSD - Serbian Dinar",
                        "value": "RSD"
                      },
                      {
                        "name": "RUB - Russian Ruble",
                        "value": "RUB"
                      },
                      {
                        "name": "RWF - Rwanda Franc",
                        "value": "RWF"
                      },
                      {
                        "name": "SAR - Saudi Riyal",
                        "value": "SAR"
                      },
                      {
                        "name": "SBD - Solomon Islands Dollar",
                        "value": "SBD"
                      },
                      {
                        "name": "SCR - Seychelles Rupee",
                        "value": "SCR"
                      },
                      {
                        "name": "SDG - Sudanese Pound",
                        "value": "SDG"
                      },
                      {
                        "name": "SEK - Swedish Krona",
                        "value": "SEK"
                      },
                      {
                        "name": "SGD - Singapore Dollar",
                        "value": "SGD"
                      },
                      {
                        "name": "SHP - Saint Helena Pound",
                        "value": "SHP"
                      },
                      {
                        "name": "SLE - Leone",
                        "value": "SLE"
                      },
                      {
                        "name": "SOS - Somali Shilling",
                        "value": "SOS"
                      },
                      {
                        "name": "SRD - Surinam Dollar",
                        "value": "SRD"
                      },
                      {
                        "name": "SSP - South Sudanese Pound",
                        "value": "SSP"
                      },
                      {
                        "name": "STN - Dobra",
                        "value": "STN"
                      },
                      {
                        "name": "SVC - El Salvador Colon",
                        "value": "SVC"
                      },
                      {
                        "name": "SYP - Syrian Pound",
                        "value": "SYP"
                      },
                      {
                        "name": "SZL - Lilangeni",
                        "value": "SZL"
                      },
                      {
                        "name": "THB - Baht",
                        "value": "THB"
                      },
                      {
                        "name": "TJS - Somoni",
                        "value": "TJS"
                      },
                      {
                        "name": "TMT - Turkmenistan New Manat",
                        "value": "TMT"
                      },
                      {
                        "name": "TND - Tunisian Dinar",
                        "value": "TND"
                      },
                      {
                        "name": "TOP - Pa’anga",
                        "value": "TOP"
                      },
                      {
                        "name": "TRY - Turkish Lira",
                        "value": "TRY"
                      },
                      {
                        "name": "TTD - Trinidad and Tobago Dollar",
                        "value": "TTD"
                      },
                      {
                        "name": "TWD - New Taiwan Dollar",
                        "value": "TWD"
                      },
                      {
                        "name": "TZS - Tanzanian Shilling",
                        "value": "TZS"
                      },
                      {
                        "name": "UAH - Hryvnia",
                        "value": "UAH"
                      },
                      {
                        "name": "UGX - Uganda Shilling",
                        "value": "UGX"
                      },
                      {
                        "name": "USD - US Dollar",
                        "value": "USD"
                      },
                      {
                        "name": "USN - US Dollar (Next day)",
                        "value": "USN"
                      },
                      {
                        "name": "UYI - Uruguay Peso en Unidades Indexadas (UI)",
                        "value": "UYI"
                      },
                      {
                        "name": "UYU - Peso Uruguayo",
                        "value": "UYU"
                      },
                      {
                        "name": "UYW - Unidad Previsional",
                        "value": "UYW"
                      },
                      {
                        "name": "UZS - Uzbekistan Sum",
                        "value": "UZS"
                      },
                      {
                        "name": "VED - Bolívar Soberano",
                        "value": "VED"
                      },
                      {
                        "name": "VES - Bolívar Soberano",
                        "value": "VES"
                      },
                      {
                        "name": "VND - Dong",
                        "value": "VND"
                      },
                      {
                        "name": "VUV - Vatu",
                        "value": "VUV"
                      },
                      {
                        "name": "WST - Tala",
                        "value": "WST"
                      },
                      {
                        "name": "XAF - CFA Franc BEAC",
                        "value": "XAF"
                      },
                      {
                        "name": "XAG - Silver",
                        "value": "XAG"
                      },
                      {
                        "name": "XAU - Gold",
                        "value": "XAU"
                      },
                      {
                        "name": "XBA - Bond Markets Unit European Composite Unit (EURCO)",
                        "value": "XBA"
                      },
                      {
                        "name": "XBB - Bond Markets Unit European Monetary Unit (E.M.U.-6)",
                        "value": "XBB"
                      },
                      {
                        "name": "XBC - Bond Markets Unit European Unit of Account 9 (E.U.A.-9)",
                        "value": "XBC"
                      },
                      {
                        "name": "XBD - Bond Markets Unit European Unit of Account 17 (E.U.A.-17)",
                        "value": "XBD"
                      },
                      {
                        "name": "XCD - East Caribbean Dollar",
                        "value": "XCD"
                      },
                      {
                        "name": "XDR - SDR (Special Drawing Right)",
                        "value": "XDR"
                      },
                      {
                        "name": "XOF - CFA Franc BCEAO",
                        "value": "XOF"
                      },
                      {
                        "name": "XPD - Palladium",
                        "value": "XPD"
                      },
                      {
                        "name": "XPF - CFP Franc",
                        "value": "XPF"
                      },
                      {
                        "name": "XPT - Platinum",
                        "value": "XPT"
                      },
                      {
                        "name": "XSU - Sucre",
                        "value": "XSU"
                      },
                      {
                        "name": "XTS - Codes specifically reserved for testing purposes",
                        "value": "XTS"
                      },
                      {
                        "name": "XUA - ADB Unit of Account",
                        "value": "XUA"
                      },
                      {
                        "name": "XXX - The codes assigned for transactions where no currency is involved",
                        "value": "XXX"
                      },
                      {
                        "name": "YER - Yemeni Rial",
                        "value": "YER"
                      },
                      {
                        "name": "ZAR - Rand",
                        "value": "ZAR"
                      },
                      {
                        "name": "ZMW - Zambian Kwacha",
                        "value": "ZMW"
                      },
                      {
                        "name": "ZWG - Zimbabwe Gold",
                        "value": "ZWG"
                      }
                    ],
                    "displayOptions": {
                      "show": {
                        "type": [
                          "currency"
                        ]
                      }
                    },
                    "default": "",
                    "placeholder": "USD"
                  },
                  {
                    "displayName": "Amount",
                    "name": "amount_1000",
                    "type": "number",
                    "displayOptions": {
                      "show": {
                        "type": [
                          "currency"
                        ]
                      }
                    },
                    "default": "",
                    "placeholder": ""
                  },
                  {
                    "displayName": "Date Time",
                    "name": "date_time",
                    "type": "dateTime",
                    "displayOptions": {
                      "show": {
                        "type": [
                          "date_time"
                        ]
                      }
                    },
                    "default": "",
                    "placeholder": ""
                  },
                  {
                    "displayName": "Fallback Value",
                    "name": "fallback_value",
                    "type": "string",
                    "displayOptions": {
                      "show": {
                        "type": [
                          "currency"
                        ]
                      }
                    },
                    "default": ""
                  }
                ]
              }
            ]
          },
          {
            "displayName": "Sub Type",
            "name": "sub_type",
            "type": "options",
            "displayOptions": {
              "show": {
                "type": [
                  "button"
                ]
              }
            },
            "options": [
              {
                "name": "Quick Reply",
                "value": "quick_reply",
                "description": "Allows your customer to call a phone number and visit a website"
              },
              {
                "name": "URL",
                "value": "url"
              }
            ],
            "default": "quick_reply"
          },
          {
            "displayName": "Index",
            "name": "index",
            "type": "number",
            "typeOptions": {
              "maxValue": 2,
              "minValue": 0
            },
            "displayOptions": {
              "show": {
                "type": [
                  "button"
                ]
              }
            },
            "default": 0
          },
          {
            "displayName": "Parameters",
            "name": "buttonParameters",
            "type": "fixedCollection",
            "typeOptions": {
              "multipleValues": false
            },
            "displayOptions": {
              "show": {
                "type": [
                  "button"
                ]
              }
            },
            "placeholder": "Add Parameter",
            "default": {},
            "options": [
              {
                "displayName": "Parameter",
                "name": "parameter",
                "values": [
                  {
                    "displayName": "Type",
                    "name": "type",
                    "type": "options",
                    "options": [
                      {
                        "name": "Payload",
                        "value": "payload"
                      },
                      {
                        "name": "Text",
                        "value": "text"
                      }
                    ],
                    "default": "payload"
                  },
                  {
                    "displayName": "Payload",
                    "name": "payload",
                    "type": "string",
                    "displayOptions": {
                      "show": {
                        "type": [
                          "payload"
                        ]
                      }
                    },
                    "default": ""
                  },
                  {
                    "displayName": "Text",
                    "name": "text",
                    "type": "string",
                    "displayOptions": {
                      "show": {
                        "type": [
                          "text"
                        ]
                      }
                    },
                    "default": ""
                  }
                ]
              }
            ]
          },
          {
            "displayName": "Parameters",
            "name": "headerParameters",
            "type": "fixedCollection",
            "typeOptions": {
              "sortable": true,
              "multipleValues": true
            },
            "displayOptions": {
              "show": {
                "type": [
                  "header"
                ]
              }
            },
            "placeholder": "Add Parameter",
            "default": {},
            "options": [
              {
                "displayName": "Parameter",
                "name": "parameter",
                "values": [
                  {
                    "displayName": "Type",
                    "name": "type",
                    "type": "options",
                    "options": [
                      {
                        "name": "Text",
                        "value": "text"
                      },
                      {
                        "name": "Currency",
                        "value": "currency"
                      },
                      {
                        "name": "Date Time",
                        "value": "date_time"
                      },
                      {
                        "name": "Image",
                        "value": "image"
                      }
                    ],
                    "default": "text"
                  },
                  {
                    "displayName": "Text",
                    "name": "text",
                    "type": "string",
                    "displayOptions": {
                      "show": {
                        "type": [
                          "text"
                        ]
                      }
                    },
                    "default": ""
                  },
                  {
                    "displayName": "Currency Code",
                    "name": "code",
                    "type": "options",
                    "options": [
                      {
                        "name": "AED - UAE Dirham",
                        "value": "AED"
                      },
                      {
                        "name": "AFN - Afghani",
                        "value": "AFN"
                      },
                      {
                        "name": "ALL - Lek",
                        "value": "ALL"
                      },
                      {
                        "name": "AMD - Armenian Dram",
                        "value": "AMD"
                      },
                      {
                        "name": "ANG - Netherlands Antillean Guilder",
                        "value": "ANG"
                      },
                      {
                        "name": "AOA - Kwanza",
                        "value": "AOA"
                      },
                      {
                        "name": "ARS - Argentine Peso",
                        "value": "ARS"
                      },
                      {
                        "name": "AUD - Australian Dollar",
                        "value": "AUD"
                      },
                      {
                        "name": "AWG - Aruban Florin",
                        "value": "AWG"
                      },
                      {
                        "name": "AZN - Azerbaijan Manat",
                        "value": "AZN"
                      },
                      {
                        "name": "BAM - Convertible Mark",
                        "value": "BAM"
                      },
                      {
                        "name": "BBD - Barbados Dollar",
                        "value": "BBD"
                      },
                      {
                        "name": "BDT - Taka",
                        "value": "BDT"
                      },
                      {
                        "name": "BGN - Bulgarian Lev",
                        "value": "BGN"
                      },
                      {
                        "name": "BHD - Bahraini Dinar",
                        "value": "BHD"
                      },
                      {
                        "name": "BIF - Burundi Franc",
                        "value": "BIF"
                      },
                      {
                        "name": "BMD - Bermudian Dollar",
                        "value": "BMD"
                      },
                      {
                        "name": "BND - Brunei Dollar",
                        "value": "BND"
                      },
                      {
                        "name": "BOB - Boliviano",
                        "value": "BOB"
                      },
                      {
                        "name": "BOV - Mvdol",
                        "value": "BOV"
                      },
                      {
                        "name": "BRL - Brazilian Real",
                        "value": "BRL"
                      },
                      {
                        "name": "BSD - Bahamian Dollar",
                        "value": "BSD"
                      },
                      {
                        "name": "BTN - Ngultrum",
                        "value": "BTN"
                      },
                      {
                        "name": "BWP - Pula",
                        "value": "BWP"
                      },
                      {
                        "name": "BYN - Belarusian Ruble",
                        "value": "BYN"
                      },
                      {
                        "name": "BZD - Belize Dollar",
                        "value": "BZD"
                      },
                      {
                        "name": "CAD - Canadian Dollar",
                        "value": "CAD"
                      },
                      {
                        "name": "CDF - Congolese Franc",
                        "value": "CDF"
                      },
                      {
                        "name": "CHE - WIR Euro",
                        "value": "CHE"
                      },
                      {
                        "name": "CHF - Swiss Franc",
                        "value": "CHF"
                      },
                      {
                        "name": "CHW - WIR Franc",
                        "value": "CHW"
                      },
                      {
                        "name": "CLF - Unidad de Fomento",
                        "value": "CLF"
                      },
                      {
                        "name": "CLP - Chilean Peso",
                        "value": "CLP"
                      },
                      {
                        "name": "CNY - Yuan Renminbi",
                        "value": "CNY"
                      },
                      {
                        "name": "COP - Colombian Peso",
                        "value": "COP"
                      },
                      {
                        "name": "COU - Unidad de Valor Real",
                        "value": "COU"
                      },
                      {
                        "name": "CRC - Costa Rican Colon",
                        "value": "CRC"
                      },
                      {
                        "name": "CUC - Peso Convertible",
                        "value": "CUC"
                      },
                      {
                        "name": "CUP - Cuban Peso",
                        "value": "CUP"
                      },
                      {
                        "name": "CVE - Cabo Verde Escudo",
                        "value": "CVE"
                      },
                      {
                        "name": "CZK - Czech Koruna",
                        "value": "CZK"
                      },
                      {
                        "name": "DJF - Djibouti Franc",
                        "value": "DJF"
                      },
                      {
                        "name": "DKK - Danish Krone",
                        "value": "DKK"
                      },
                      {
                        "name": "DOP - Dominican Peso",
                        "value": "DOP"
                      },
                      {
                        "name": "DZD - Algerian Dinar",
                        "value": "DZD"
                      },
                      {
                        "name": "EGP - Egyptian Pound",
                        "value": "EGP"
                      },
                      {
                        "name": "ERN - Nakfa",
                        "value": "ERN"
                      },
                      {
                        "name": "ETB - Ethiopian Birr",
                        "value": "ETB"
                      },
                      {
                        "name": "EUR - Euro",
                        "value": "EUR"
                      },
                      {
                        "name": "FJD - Fiji Dollar",
                        "value": "FJD"
                      },
                      {
                        "name": "FKP - Falkland Islands Pound",
                        "value": "FKP"
                      },
                      {
                        "name": "GBP - Pound Sterling",
                        "value": "GBP"
                      },
                      {
                        "name": "GEL - Lari",
                        "value": "GEL"
                      },
                      {
                        "name": "GHS - Ghana Cedi",
                        "value": "GHS"
                      },
                      {
                        "name": "GIP - Gibraltar Pound",
                        "value": "GIP"
                      },
                      {
                        "name": "GMD - Dalasi",
                        "value": "GMD"
                      },
                      {
                        "name": "GNF - Guinean Franc",
                        "value": "GNF"
                      },
                      {
                        "name": "GTQ - Quetzal",
                        "value": "GTQ"
                      },
                      {
                        "name": "GYD - Guyana Dollar",
                        "value": "GYD"
                      },
                      {
                        "name": "HKD - Hong Kong Dollar",
                        "value": "HKD"
                      },
                      {
                        "name": "HNL - Lempira",
                        "value": "HNL"
                      },
                      {
                        "name": "HTG - Gourde",
                        "value": "HTG"
                      },
                      {
                        "name": "HUF - Forint",
                        "value": "HUF"
                      },
                      {
                        "name": "IDR - Rupiah",
                        "value": "IDR"
                      },
                      {
                        "name": "ILS - New Israeli Sheqel",
                        "value": "ILS"
                      },
                      {
                        "name": "INR - Indian Rupee",
                        "value": "INR"
                      },
                      {
                        "name": "IQD - Iraqi Dinar",
                        "value": "IQD"
                      },
                      {
                        "name": "IRR - Iranian Rial",
                        "value": "IRR"
                      },
                      {
                        "name": "ISK - Iceland Krona",
                        "value": "ISK"
                      },
                      {
                        "name": "JMD - Jamaican Dollar",
                        "value": "JMD"
                      },
                      {
                        "name": "JOD - Jordanian Dinar",
                        "value": "JOD"
                      },
                      {
                        "name": "JPY - Yen",
                        "value": "JPY"
                      },
                      {
                        "name": "KES - Kenyan Shilling",
                        "value": "KES"
                      },
                      {
                        "name": "KGS - Som",
                        "value": "KGS"
                      },
                      {
                        "name": "KHR - Riel",
                        "value": "KHR"
                      },
                      {
                        "name": "KMF - Comorian Franc ",
                        "value": "KMF"
                      },
                      {
                        "name": "KPW - North Korean Won",
                        "value": "KPW"
                      },
                      {
                        "name": "KRW - Won",
                        "value": "KRW"
                      },
                      {
                        "name": "KWD - Kuwaiti Dinar",
                        "value": "KWD"
                      },
                      {
                        "name": "KYD - Cayman Islands Dollar",
                        "value": "KYD"
                      },
                      {
                        "name": "KZT - Tenge",
                        "value": "KZT"
                      },
                      {
                        "name": "LAK - Lao Kip",
                        "value": "LAK"
                      },
                      {
                        "name": "LBP - Lebanese Pound",
                        "value": "LBP"
                      },
                      {
                        "name": "LKR - Sri Lanka Rupee",
                        "value": "LKR"
                      },
                      {
                        "name": "LRD - Liberian Dollar",
                        "value": "LRD"
                      },
                      {
                        "name": "LSL - Loti",
                        "value": "LSL"
                      },
                      {
                        "name": "LYD - Libyan Dinar",
                        "value": "LYD"
                      },
                      {
                        "name": "MAD - Moroccan Dirham",
                        "value": "MAD"
                      },
                      {
                        "name": "MDL - Moldovan Leu",
                        "value": "MDL"
                      },
                      {
                        "name": "MGA - Malagasy Ariary",
                        "value": "MGA"
                      },
                      {
                        "name": "MKD - Denar",
                        "value": "MKD"
                      },
                      {
                        "name": "MMK - Kyat",
                        "value": "MMK"
                      },
                      {
                        "name": "MNT - Tugrik",
                        "value": "MNT"
                      },
                      {
                        "name": "MOP - Pataca",
                        "value": "MOP"
                      },
                      {
                        "name": "MRU - Ouguiya",
                        "value": "MRU"
                      },
                      {
                        "name": "MUR - Mauritius Rupee",
                        "value": "MUR"
                      },
                      {
                        "name": "MVR - Rufiyaa",
                        "value": "MVR"
                      },
                      {
                        "name": "MWK - Malawi Kwacha",
                        "value": "MWK"
                      },
                      {
                        "name": "MXN - Mexican Peso",
                        "value": "MXN"
                      },
                      {
                        "name": "MXV - Mexican Unidad de Inversion (UDI)",
                        "value": "MXV"
                      },
                      {
                        "name": "MYR - Malaysian Ringgit",
                        "value": "MYR"
                      },
                      {
                        "name": "MZN - Mozambique Metical",
                        "value": "MZN"
                      },
                      {
                        "name": "NAD - Namibia Dollar",
                        "value": "NAD"
                      },
                      {
                        "name": "NGN - Naira",
                        "value": "NGN"
                      },
                      {
                        "name": "NIO - Cordoba Oro",
                        "value": "NIO"
                      },
                      {
                        "name": "NOK - Norwegian Krone",
                        "value": "NOK"
                      },
                      {
                        "name": "NPR - Nepalese Rupee",
                        "value": "NPR"
                      },
                      {
                        "name": "NZD - New Zealand Dollar",
                        "value": "NZD"
                      },
                      {
                        "name": "OMR - Rial Omani",
                        "value": "OMR"
                      },
                      {
                        "name": "PAB - Balboa",
                        "value": "PAB"
                      },
                      {
                        "name": "PEN - Sol",
                        "value": "PEN"
                      },
                      {
                        "name": "PGK - Kina",
                        "value": "PGK"
                      },
                      {
                        "name": "PHP - Philippine Peso",
                        "value": "PHP"
                      },
                      {
                        "name": "PKR - Pakistan Rupee",
                        "value": "PKR"
                      },
                      {
                        "name": "PLN - Zloty",
                        "value": "PLN"
                      },
                      {
                        "name": "PYG - Guarani",
                        "value": "PYG"
                      },
                      {
                        "name": "QAR - Qatari Rial",
                        "value": "QAR"
                      },
                      {
                        "name": "RON - Romanian Leu",
                        "value": "RON"
                      },
                      {
                        "name": "RSD - Serbian Dinar",
                        "value": "RSD"
                      },
                      {
                        "name": "RUB - Russian Ruble",
                        "value": "RUB"
                      },
                      {
                        "name": "RWF - Rwanda Franc",
                        "value": "RWF"
                      },
                      {
                        "name": "SAR - Saudi Riyal",
                        "value": "SAR"
                      },
                      {
                        "name": "SBD - Solomon Islands Dollar",
                        "value": "SBD"
                      },
                      {
                        "name": "SCR - Seychelles Rupee",
                        "value": "SCR"
                      },
                      {
                        "name": "SDG - Sudanese Pound",
                        "value": "SDG"
                      },
                      {
                        "name": "SEK - Swedish Krona",
                        "value": "SEK"
                      },
                      {
                        "name": "SGD - Singapore Dollar",
                        "value": "SGD"
                      },
                      {
                        "name": "SHP - Saint Helena Pound",
                        "value": "SHP"
                      },
                      {
                        "name": "SLE - Leone",
                        "value": "SLE"
                      },
                      {
                        "name": "SOS - Somali Shilling",
                        "value": "SOS"
                      },
                      {
                        "name": "SRD - Surinam Dollar",
                        "value": "SRD"
                      },
                      {
                        "name": "SSP - South Sudanese Pound",
                        "value": "SSP"
                      },
                      {
                        "name": "STN - Dobra",
                        "value": "STN"
                      },
                      {
                        "name": "SVC - El Salvador Colon",
                        "value": "SVC"
                      },
                      {
                        "name": "SYP - Syrian Pound",
                        "value": "SYP"
                      },
                      {
                        "name": "SZL - Lilangeni",
                        "value": "SZL"
                      },
                      {
                        "name": "THB - Baht",
                        "value": "THB"
                      },
                      {
                        "name": "TJS - Somoni",
                        "value": "TJS"
                      },
                      {
                        "name": "TMT - Turkmenistan New Manat",
                        "value": "TMT"
                      },
                      {
                        "name": "TND - Tunisian Dinar",
                        "value": "TND"
                      },
                      {
                        "name": "TOP - Pa’anga",
                        "value": "TOP"
                      },
                      {
                        "name": "TRY - Turkish Lira",
                        "value": "TRY"
                      },
                      {
                        "name": "TTD - Trinidad and Tobago Dollar",
                        "value": "TTD"
                      },
                      {
                        "name": "TWD - New Taiwan Dollar",
                        "value": "TWD"
                      },
                      {
                        "name": "TZS - Tanzanian Shilling",
                        "value": "TZS"
                      },
                      {
                        "name": "UAH - Hryvnia",
                        "value": "UAH"
                      },
                      {
                        "name": "UGX - Uganda Shilling",
                        "value": "UGX"
                      },
                      {
                        "name": "USD - US Dollar",
                        "value": "USD"
                      },
                      {
                        "name": "USN - US Dollar (Next day)",
                        "value": "USN"
                      },
                      {
                        "name": "UYI - Uruguay Peso en Unidades Indexadas (UI)",
                        "value": "UYI"
                      },
                      {
                        "name": "UYU - Peso Uruguayo",
                        "value": "UYU"
                      },
                      {
                        "name": "UYW - Unidad Previsional",
                        "value": "UYW"
                      },
                      {
                        "name": "UZS - Uzbekistan Sum",
                        "value": "UZS"
                      },
                      {
                        "name": "VED - Bolívar Soberano",
                        "value": "VED"
                      },
                      {
                        "name": "VES - Bolívar Soberano",
                        "value": "VES"
                      },
                      {
                        "name": "VND - Dong",
                        "value": "VND"
                      },
                      {
                        "name": "VUV - Vatu",
                        "value": "VUV"
                      },
                      {
                        "name": "WST - Tala",
                        "value": "WST"
                      },
                      {
                        "name": "XAF - CFA Franc BEAC",
                        "value": "XAF"
                      },
                      {
                        "name": "XAG - Silver",
                        "value": "XAG"
                      },
                      {
                        "name": "XAU - Gold",
                        "value": "XAU"
                      },
                      {
                        "name": "XBA - Bond Markets Unit European Composite Unit (EURCO)",
                        "value": "XBA"
                      },
                      {
                        "name": "XBB - Bond Markets Unit European Monetary Unit (E.M.U.-6)",
                        "value": "XBB"
                      },
                      {
                        "name": "XBC - Bond Markets Unit European Unit of Account 9 (E.U.A.-9)",
                        "value": "XBC"
                      },
                      {
                        "name": "XBD - Bond Markets Unit European Unit of Account 17 (E.U.A.-17)",
                        "value": "XBD"
                      },
                      {
                        "name": "XCD - East Caribbean Dollar",
                        "value": "XCD"
                      },
                      {
                        "name": "XDR - SDR (Special Drawing Right)",
                        "value": "XDR"
                      },
                      {
                        "name": "XOF - CFA Franc BCEAO",
                        "value": "XOF"
                      },
                      {
                        "name": "XPD - Palladium",
                        "value": "XPD"
                      },
                      {
                        "name": "XPF - CFP Franc",
                        "value": "XPF"
                      },
                      {
                        "name": "XPT - Platinum",
                        "value": "XPT"
                      },
                      {
                        "name": "XSU - Sucre",
                        "value": "XSU"
                      },
                      {
                        "name": "XTS - Codes specifically reserved for testing purposes",
                        "value": "XTS"
                      },
                      {
                        "name": "XUA - ADB Unit of Account",
                        "value": "XUA"
                      },
                      {
                        "name": "XXX - The codes assigned for transactions where no currency is involved",
                        "value": "XXX"
                      },
                      {
                        "name": "YER - Yemeni Rial",
                        "value": "YER"
                      },
                      {
                        "name": "ZAR - Rand",
                        "value": "ZAR"
                      },
                      {
                        "name": "ZMW - Zambian Kwacha",
                        "value": "ZMW"
                      },
                      {
                        "name": "ZWG - Zimbabwe Gold",
                        "value": "ZWG"
                      }
                    ],
                    "displayOptions": {
                      "show": {
                        "type": [
                          "currency"
                        ]
                      }
                    },
                    "default": "",
                    "placeholder": "USD"
                  },
                  {
                    "displayName": "Amount",
                    "name": "amount_1000",
                    "type": "number",
                    "displayOptions": {
                      "show": {
                        "type": [
                          "currency"
                        ]
                      }
                    },
                    "default": "",
                    "placeholder": ""
                  },
                  {
                    "displayName": "Date Time",
                    "name": "date_time",
                    "type": "dateTime",
                    "displayOptions": {
                      "show": {
                        "type": [
                          "date_time"
                        ]
                      }
                    },
                    "default": "",
                    "placeholder": ""
                  },
                  {
                    "displayName": "Image Link",
                    "name": "imageLink",
                    "type": "string",
                    "displayOptions": {
                      "show": {
                        "type": [
                          "image"
                        ]
                      }
                    },
                    "default": ""
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "displayName": "Additional Fields",
    "name": "additionalFields",
    "type": "collection",
    "placeholder": "Add Field",
    "default": {},
    "displayOptions": {
      "show": {
        "resource": [
          "message"
        ],
        "operation": [
          "send"
        ],
        "messageType": [
          "text"
        ]
      }
    },
    "options": [
      {
        "displayName": "Show URL Previews",
        "name": "previewUrl",
        "type": "boolean",
        "default": false,
        "description": "Whether to display URL previews in text messages",
        "routing": {
          "send": {
            "type": "body",
            "property": "text.preview_url"
          }
        }
      }
    ]
  },
  {
    "displayName": "Sender Phone Number (or ID)",
    "name": "phoneNumberId",
    "type": "options",
    "typeOptions": {
      "loadOptions": {
        "routing": {
          "request": {
            "url": "={{$credentials.businessAccountId}}/phone_numbers",
            "method": "GET"
          },
          "output": {
            "postReceive": [
              {
                "type": "rootProperty",
                "properties": {
                  "property": "data"
                }
              },
              {
                "type": "setKeyValue",
                "properties": {
                  "name": "={{$responseItem.display_phone_number}} - {{$responseItem.verified_name}}",
                  "value": "={{$responseItem.id}}"
                }
              },
              {
                "type": "sort",
                "properties": {
                  "key": "name"
                }
              }
            ]
          }
        }
      }
    },
    "default": "",
    "placeholder": "",
    "routing": {
      "request": {
        "method": "POST",
        "url": "={{$value}}/media"
      }
    },
    "displayOptions": {
      "show": {
        "operation": [
          "mediaUpload"
        ],
        "resource": [
          "media"
        ]
      }
    },
    "required": true,
    "description": "The ID of the business account's phone number to store the media"
  },
  {
    "displayName": "Property Name",
    "name": "mediaPropertyName",
    "type": "string",
    "default": "data",
    "displayOptions": {
      "show": {
        "operation": [
          "mediaUpload"
        ],
        "resource": [
          "media"
        ]
      }
    },
    "required": true,
    "description": "Name of the binary property which contains the data for the file to be uploaded",
    "routing": {
      "send": {
        "preSend": [
          null
        ]
      }
    }
  },
  {
    "displayName": "Media ID",
    "name": "mediaGetId",
    "type": "string",
    "default": "",
    "displayOptions": {
      "show": {
        "operation": [
          "mediaUrlGet"
        ],
        "resource": [
          "media"
        ]
      }
    },
    "routing": {
      "request": {
        "method": "GET",
        "url": "=/{{$value}}"
      }
    },
    "required": true,
    "description": "The ID of the media"
  },
  {
    "displayName": "Media ID",
    "name": "mediaDeleteId",
    "type": "string",
    "default": "",
    "displayOptions": {
      "show": {
        "operation": [
          "mediaDelete"
        ],
        "resource": [
          "media"
        ]
      }
    },
    "routing": {
      "request": {
        "method": "DELETE",
        "url": "=/{{$value}}"
      }
    },
    "required": true,
    "description": "The ID of the media"
  },
  {
    "displayName": "Additional Fields",
    "name": "additionalFields",
    "type": "collection",
    "placeholder": "Add Field",
    "default": {},
    "displayOptions": {
      "show": {
        "resource": [
          "media"
        ],
        "operation": [
          "mediaUpload"
        ]
      }
    },
    "options": [
      {
        "displayName": "Filename",
        "name": "mediaFileName",
        "type": "string",
        "default": "",
        "description": "The name to use for the file"
      }
    ]
  }
];
