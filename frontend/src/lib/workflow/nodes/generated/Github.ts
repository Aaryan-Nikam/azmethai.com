/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/Github/Github.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const GithubProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Authentication",
    "name": "authentication",
    "type": "options",
    "options": [
      {
        "name": "Access Token",
        "value": "accessToken"
      },
      {
        "name": "OAuth2",
        "value": "oAuth2"
      }
    ],
    "default": "accessToken"
  },
  {
    "displayName": "Resource",
    "name": "resource",
    "type": "options",
    "noDataExpression": true,
    "options": [
      {
        "name": "File",
        "value": "file"
      },
      {
        "name": "Issue",
        "value": "issue"
      },
      {
        "name": "Organization",
        "value": "organization"
      },
      {
        "name": "Release",
        "value": "release"
      },
      {
        "name": "Repository",
        "value": "repository"
      },
      {
        "name": "Review",
        "value": "review"
      },
      {
        "name": "User",
        "value": "user"
      }
    ],
    "default": "issue"
  },
  {
    "displayName": "Operation",
    "name": "operation",
    "type": "options",
    "noDataExpression": true,
    "displayOptions": {
      "show": {
        "resource": [
          "organization"
        ]
      }
    },
    "options": [
      {
        "name": "Get Repositories",
        "value": "getRepositories",
        "description": "Returns all repositories of an organization",
        "action": "Get repositories for an organization"
      }
    ],
    "default": "getRepositories"
  },
  {
    "displayName": "Operation",
    "name": "operation",
    "type": "options",
    "noDataExpression": true,
    "displayOptions": {
      "show": {
        "resource": [
          "issue"
        ]
      }
    },
    "options": [
      {
        "name": "Create",
        "value": "create",
        "description": "Create a new issue",
        "action": "Create an issue"
      },
      {
        "name": "Create Comment",
        "value": "createComment",
        "description": "Create a new comment on an issue",
        "action": "Create a comment on an issue"
      },
      {
        "name": "Edit",
        "value": "edit",
        "description": "Edit an issue",
        "action": "Edit an issue"
      },
      {
        "name": "Get",
        "value": "get",
        "description": "Get the data of a single issue",
        "action": "Get an issue"
      },
      {
        "name": "Lock",
        "value": "lock",
        "description": "Lock an issue",
        "action": "Lock an issue"
      }
    ],
    "default": "create"
  },
  {
    "displayName": "Operation",
    "name": "operation",
    "type": "options",
    "noDataExpression": true,
    "displayOptions": {
      "show": {
        "resource": [
          "file"
        ]
      }
    },
    "options": [
      {
        "name": "Create",
        "value": "create",
        "description": "Create a new file in repository",
        "action": "Create a file"
      },
      {
        "name": "Delete",
        "value": "delete",
        "description": "Delete a file in repository",
        "action": "Delete a file"
      },
      {
        "name": "Edit",
        "value": "edit",
        "description": "Edit a file in repository",
        "action": "Edit a file"
      },
      {
        "name": "Get",
        "value": "get",
        "description": "Get the data of a single file",
        "action": "Get a file"
      },
      {
        "name": "List",
        "value": "list",
        "description": "List contents of a folder",
        "action": "List a file"
      }
    ],
    "default": "create"
  },
  {
    "displayName": "Operation",
    "name": "operation",
    "type": "options",
    "noDataExpression": true,
    "displayOptions": {
      "show": {
        "resource": [
          "repository"
        ]
      }
    },
    "options": [
      {
        "name": "Get",
        "value": "get",
        "description": "Get the data of a single repository",
        "action": "Get a repository"
      },
      {
        "name": "Get Issues",
        "value": "getIssues",
        "description": "Returns issues of a repository",
        "action": "Get issues of a repository"
      },
      {
        "name": "Get License",
        "value": "getLicense",
        "description": "Returns the contents of the repository's license file, if one is detected",
        "action": "Get the license of a repository"
      },
      {
        "name": "Get Profile",
        "value": "getProfile",
        "description": "Get the community profile of a repository with metrics, health score, description, license, etc",
        "action": "Get the profile of a repository"
      },
      {
        "name": "List Popular Paths",
        "value": "listPopularPaths",
        "description": "Get the top 10 popular content paths over the last 14 days",
        "action": "List popular paths in a repository"
      },
      {
        "name": "List Referrers",
        "value": "listReferrers",
        "description": "Get the top 10 referrering domains over the last 14 days",
        "action": "List the top referrers of a repository"
      }
    ],
    "default": "getIssues"
  },
  {
    "displayName": "Operation",
    "name": "operation",
    "type": "options",
    "noDataExpression": true,
    "displayOptions": {
      "show": {
        "resource": [
          "user"
        ]
      }
    },
    "options": [
      {
        "name": "Get Repositories",
        "value": "getRepositories",
        "description": "Returns the repositories of a user",
        "action": "Get a user's repositories"
      },
      {
        "name": "Invite",
        "value": "invite",
        "description": "Invites a user to an organization",
        "action": "Invite a user"
      }
    ],
    "default": "getRepositories"
  },
  {
    "displayName": "Operation",
    "name": "operation",
    "type": "options",
    "noDataExpression": true,
    "displayOptions": {
      "show": {
        "resource": [
          "release"
        ]
      }
    },
    "options": [
      {
        "name": "Create",
        "value": "create",
        "description": "Creates a new release",
        "action": "Create a release"
      },
      {
        "name": "Delete",
        "value": "delete",
        "description": "Delete a release",
        "action": "Delete a release"
      },
      {
        "name": "Get",
        "value": "get",
        "description": "Get a release",
        "action": "Get a release"
      },
      {
        "name": "Get Many",
        "value": "getAll",
        "description": "Get many repository releases",
        "action": "Get many releases"
      },
      {
        "name": "Update",
        "value": "update",
        "description": "Update a release",
        "action": "Update a release"
      }
    ],
    "default": "create"
  },
  {
    "displayName": "Operation",
    "name": "operation",
    "type": "options",
    "noDataExpression": true,
    "displayOptions": {
      "show": {
        "resource": [
          "review"
        ]
      }
    },
    "options": [
      {
        "name": "Create",
        "value": "create",
        "description": "Creates a new review",
        "action": "Create a review"
      },
      {
        "name": "Get",
        "value": "get",
        "description": "Get a review for a pull request",
        "action": "Get a review"
      },
      {
        "name": "Get Many",
        "value": "getAll",
        "description": "Get many reviews for a pull request",
        "action": "Get many reviews"
      },
      {
        "name": "Update",
        "value": "update",
        "description": "Update a review",
        "action": "Update a review"
      }
    ],
    "default": "create"
  },
  {
    "displayName": "Repository Owner",
    "name": "owner",
    "type": "resourceLocator",
    "default": {
      "mode": "list",
      "value": ""
    },
    "required": true,
    "modes": [
      {
        "displayName": "Repository Owner",
        "name": "list",
        "type": "list",
        "placeholder": "Select an owner...",
        "typeOptions": {
          "searchListMethod": "getUsers",
          "searchable": true,
          "searchFilterRequired": true
        }
      },
      {
        "displayName": "Link",
        "name": "url",
        "type": "string",
        "placeholder": "e.g. https://github.com/n8n-io",
        "extractValue": {
          "type": "regex",
          "regex": "https:\\/\\/github.com\\/([-_0-9a-zA-Z]+)"
        },
        "validation": [
          {
            "type": "regex",
            "properties": {
              "regex": "https:\\/\\/github.com\\/([-_0-9a-zA-Z]+)(?:.*)",
              "errorMessage": "Not a valid Github URL"
            }
          }
        ]
      },
      {
        "displayName": "By Name",
        "name": "name",
        "type": "string",
        "placeholder": "e.g. n8n-io",
        "validation": [
          {
            "type": "regex",
            "properties": {
              "regex": "[-_a-zA-Z0-9]+",
              "errorMessage": "Not a valid Github Owner Name"
            }
          }
        ],
        "url": "=https://github.com/{{$value}}"
      }
    ],
    "displayOptions": {
      "hide": {
        "operation": [
          "invite"
        ]
      }
    }
  },
  {
    "displayName": "Repository Name",
    "name": "repository",
    "type": "resourceLocator",
    "default": {
      "mode": "list",
      "value": ""
    },
    "required": true,
    "modes": [
      {
        "displayName": "Repository Name",
        "name": "list",
        "type": "list",
        "placeholder": "Select an Repository...",
        "typeOptions": {
          "searchListMethod": "getRepositories",
          "searchable": true
        }
      },
      {
        "displayName": "Link",
        "name": "url",
        "type": "string",
        "placeholder": "e.g. https://github.com/n8n-io/n8n",
        "extractValue": {
          "type": "regex",
          "regex": "https:\\/\\/github.com\\/(?:[-_0-9a-zA-Z]+)\\/([-_.0-9a-zA-Z]+)"
        },
        "validation": [
          {
            "type": "regex",
            "properties": {
              "regex": "https:\\/\\/github.com\\/(?:[-_0-9a-zA-Z]+)\\/([-_.0-9a-zA-Z]+)(?:.*)",
              "errorMessage": "Not a valid Github Repository URL"
            }
          }
        ]
      },
      {
        "displayName": "By Name",
        "name": "name",
        "type": "string",
        "placeholder": "e.g. n8n",
        "validation": [
          {
            "type": "regex",
            "properties": {
              "regex": "[-_.0-9a-zA-Z]+",
              "errorMessage": "Not a valid Github Repository Name"
            }
          }
        ],
        "url": "=https://github.com/{{$parameter[\"owner\"]}}/{{$value}}"
      }
    ],
    "displayOptions": {
      "hide": {
        "resource": [
          "user",
          "organization"
        ],
        "operation": [
          "getRepositories"
        ]
      }
    }
  },
  {
    "displayName": "File Path",
    "name": "filePath",
    "type": "string",
    "default": "",
    "required": true,
    "displayOptions": {
      "show": {
        "resource": [
          "file"
        ]
      },
      "hide": {
        "operation": [
          "list"
        ]
      }
    },
    "placeholder": "docs/README.md",
    "description": "The file path of the file. Has to contain the full path."
  },
  {
    "displayName": "Path",
    "name": "filePath",
    "type": "string",
    "default": "",
    "displayOptions": {
      "show": {
        "resource": [
          "file"
        ],
        "operation": [
          "list"
        ]
      }
    },
    "placeholder": "docs/",
    "description": "The path of the folder to list"
  },
  {
    "displayName": "Binary Data",
    "name": "binaryData",
    "type": "boolean",
    "default": false,
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "create",
          "edit"
        ],
        "resource": [
          "file"
        ]
      }
    },
    "description": "Whether the data to upload should be taken from binary field"
  },
  {
    "displayName": "File Content",
    "name": "fileContent",
    "type": "string",
    "default": "",
    "required": true,
    "displayOptions": {
      "show": {
        "binaryData": [
          false
        ],
        "operation": [
          "create",
          "edit"
        ],
        "resource": [
          "file"
        ]
      }
    },
    "placeholder": "",
    "description": "The text content of the file"
  },
  {
    "displayName": "Binary Property",
    "name": "binaryPropertyName",
    "type": "string",
    "default": "data",
    "required": true,
    "displayOptions": {
      "show": {
        "binaryData": [
          true
        ],
        "operation": [
          "create",
          "edit"
        ],
        "resource": [
          "file"
        ]
      }
    },
    "placeholder": "",
    "description": "Name of the binary property which contains the data for the file"
  },
  {
    "displayName": "Commit Message",
    "name": "commitMessage",
    "type": "string",
    "default": "",
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "create",
          "delete",
          "edit"
        ],
        "resource": [
          "file"
        ]
      }
    }
  },
  {
    "displayName": "Additional Parameters",
    "name": "additionalParameters",
    "placeholder": "Add Parameter",
    "description": "Additional fields to add",
    "type": "fixedCollection",
    "default": {},
    "displayOptions": {
      "show": {
        "operation": [
          "create",
          "delete",
          "edit"
        ],
        "resource": [
          "file"
        ]
      }
    },
    "options": [
      {
        "name": "author",
        "displayName": "Author",
        "values": [
          {
            "displayName": "Name",
            "name": "name",
            "type": "string",
            "default": "",
            "description": "The name of the author of the commit"
          },
          {
            "displayName": "Email",
            "name": "email",
            "type": "string",
            "placeholder": "name@email.com",
            "default": "",
            "description": "The email of the author of the commit"
          }
        ]
      },
      {
        "name": "branch",
        "displayName": "Branch",
        "values": [
          {
            "displayName": "Branch",
            "name": "branch",
            "type": "string",
            "default": "",
            "description": "The branch to commit to. If not set the repository’s default branch (usually master) is used."
          }
        ]
      },
      {
        "name": "committer",
        "displayName": "Committer",
        "values": [
          {
            "displayName": "Name",
            "name": "name",
            "type": "string",
            "default": "",
            "description": "The name of the committer of the commit"
          },
          {
            "displayName": "Email",
            "name": "email",
            "type": "string",
            "placeholder": "name@email.com",
            "default": "",
            "description": "The email of the committer of the commit"
          }
        ]
      }
    ]
  },
  {
    "displayName": "As Binary Property",
    "name": "asBinaryProperty",
    "type": "boolean",
    "default": true,
    "displayOptions": {
      "show": {
        "operation": [
          "get"
        ],
        "resource": [
          "file"
        ]
      }
    },
    "description": "Whether to set the data of the file as binary property instead of returning the raw API response"
  },
  {
    "displayName": "Binary Property",
    "name": "binaryPropertyName",
    "type": "string",
    "default": "data",
    "required": true,
    "displayOptions": {
      "show": {
        "asBinaryProperty": [
          true
        ],
        "operation": [
          "get"
        ],
        "resource": [
          "file"
        ]
      }
    },
    "placeholder": "",
    "description": "Name of the binary property in which to save the binary data of the received file"
  },
  {
    "displayName": "Additional Parameters",
    "name": "additionalParameters",
    "placeholder": "Add Parameter",
    "description": "Additional fields to add",
    "type": "collection",
    "default": {},
    "displayOptions": {
      "show": {
        "operation": [
          "get"
        ],
        "resource": [
          "file"
        ]
      }
    },
    "options": [
      {
        "displayName": "Reference",
        "name": "reference",
        "type": "string",
        "default": "",
        "placeholder": "master",
        "description": "The name of the commit/branch/tag. Default: the repository’s default branch (usually master)."
      }
    ]
  },
  {
    "displayName": "Title",
    "name": "title",
    "type": "string",
    "default": "",
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "create"
        ],
        "resource": [
          "issue"
        ]
      }
    },
    "description": "The title of the issue"
  },
  {
    "displayName": "Body",
    "name": "body",
    "type": "string",
    "typeOptions": {
      "rows": 5
    },
    "default": "",
    "displayOptions": {
      "show": {
        "operation": [
          "create"
        ],
        "resource": [
          "issue"
        ]
      }
    },
    "description": "The body of the issue"
  },
  {
    "displayName": "Labels",
    "name": "labels",
    "type": "collection",
    "typeOptions": {
      "multipleValues": true,
      "multipleValueButtonText": "Add Label"
    },
    "displayOptions": {
      "show": {
        "operation": [
          "create"
        ],
        "resource": [
          "issue"
        ]
      }
    },
    "default": {
      "label": ""
    },
    "options": [
      {
        "displayName": "Label",
        "name": "label",
        "type": "string",
        "default": "",
        "description": "Label to add to issue"
      }
    ]
  },
  {
    "displayName": "Assignees",
    "name": "assignees",
    "type": "collection",
    "typeOptions": {
      "multipleValues": true,
      "multipleValueButtonText": "Add Assignee"
    },
    "displayOptions": {
      "show": {
        "operation": [
          "create"
        ],
        "resource": [
          "issue"
        ]
      }
    },
    "default": {
      "assignee": ""
    },
    "options": [
      {
        "displayName": "Assignee",
        "name": "assignee",
        "type": "string",
        "default": "",
        "description": "User to assign issue too"
      }
    ]
  },
  {
    "displayName": "Issue Number",
    "name": "issueNumber",
    "type": "number",
    "default": 0,
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "createComment"
        ],
        "resource": [
          "issue"
        ]
      }
    },
    "description": "The number of the issue on which to create the comment on"
  },
  {
    "displayName": "Body",
    "name": "body",
    "type": "string",
    "typeOptions": {
      "rows": 5
    },
    "displayOptions": {
      "show": {
        "operation": [
          "createComment"
        ],
        "resource": [
          "issue"
        ]
      }
    },
    "default": "",
    "description": "The body of the comment"
  },
  {
    "displayName": "Issue Number",
    "name": "issueNumber",
    "type": "number",
    "default": 0,
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "edit"
        ],
        "resource": [
          "issue"
        ]
      }
    },
    "description": "The number of the issue edit"
  },
  {
    "displayName": "Edit Fields",
    "name": "editFields",
    "type": "collection",
    "typeOptions": {
      "multipleValueButtonText": "Add Field"
    },
    "displayOptions": {
      "show": {
        "operation": [
          "edit"
        ],
        "resource": [
          "issue"
        ]
      }
    },
    "default": {},
    "options": [
      {
        "displayName": "Title",
        "name": "title",
        "type": "string",
        "default": "",
        "description": "The title of the issue"
      },
      {
        "displayName": "Body",
        "name": "body",
        "type": "string",
        "typeOptions": {
          "rows": 5
        },
        "default": "",
        "description": "The body of the issue"
      },
      {
        "displayName": "State",
        "name": "state",
        "type": "options",
        "options": [
          {
            "name": "Closed",
            "value": "closed",
            "description": "Set the state to \"closed\""
          },
          {
            "name": "Open",
            "value": "open",
            "description": "Set the state to \"open\""
          }
        ],
        "default": "open",
        "description": "The state to set"
      },
      {
        "displayName": "Labels",
        "name": "labels",
        "type": "collection",
        "typeOptions": {
          "multipleValues": true,
          "multipleValueButtonText": "Add Label"
        },
        "default": {
          "label": ""
        },
        "options": [
          {
            "displayName": "Label",
            "name": "label",
            "type": "string",
            "default": "",
            "description": "Label to add to issue"
          }
        ]
      },
      {
        "displayName": "Assignees",
        "name": "assignees",
        "type": "collection",
        "typeOptions": {
          "multipleValues": true,
          "multipleValueButtonText": "Add Assignee"
        },
        "default": {
          "assignee": ""
        },
        "options": [
          {
            "displayName": "Assignees",
            "name": "assignee",
            "type": "string",
            "default": "",
            "description": "User to assign issue to"
          }
        ]
      }
    ]
  },
  {
    "displayName": "Issue Number",
    "name": "issueNumber",
    "type": "number",
    "default": 0,
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "get"
        ],
        "resource": [
          "issue"
        ]
      }
    },
    "description": "The number of the issue get data of"
  },
  {
    "displayName": "Issue Number",
    "name": "issueNumber",
    "type": "number",
    "default": 0,
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "lock"
        ],
        "resource": [
          "issue"
        ]
      }
    },
    "description": "The number of the issue to lock"
  },
  {
    "displayName": "Lock Reason",
    "name": "lockReason",
    "type": "options",
    "displayOptions": {
      "show": {
        "operation": [
          "lock"
        ],
        "resource": [
          "issue"
        ]
      }
    },
    "options": [
      {
        "name": "Off-Topic",
        "value": "off-topic",
        "description": "The issue is Off-Topic"
      },
      {
        "name": "Too Heated",
        "value": "too heated",
        "description": "The discussion is too heated"
      },
      {
        "name": "Resolved",
        "value": "resolved",
        "description": "The issue got resolved"
      },
      {
        "name": "Spam",
        "value": "spam",
        "description": "The issue is spam"
      }
    ],
    "default": "resolved",
    "description": "The reason to lock the issue"
  },
  {
    "displayName": "Tag",
    "name": "releaseTag",
    "type": "string",
    "default": "",
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "create"
        ],
        "resource": [
          "release"
        ]
      }
    },
    "description": "The tag of the release"
  },
  {
    "displayName": "Additional Fields",
    "name": "additionalFields",
    "type": "collection",
    "typeOptions": {
      "multipleValueButtonText": "Add Field"
    },
    "displayOptions": {
      "show": {
        "operation": [
          "create"
        ],
        "resource": [
          "release"
        ]
      }
    },
    "default": {},
    "options": [
      {
        "displayName": "Name",
        "name": "name",
        "type": "string",
        "default": "",
        "description": "The name of the issue"
      },
      {
        "displayName": "Body",
        "name": "body",
        "type": "string",
        "typeOptions": {
          "rows": 5
        },
        "default": "",
        "description": "The body of the release"
      },
      {
        "displayName": "Draft",
        "name": "draft",
        "type": "boolean",
        "default": false,
        "description": "Whether to create a draft (unpublished) release, \"false\" to create a published one"
      },
      {
        "displayName": "Prerelease",
        "name": "prerelease",
        "type": "boolean",
        "default": false,
        "description": "Whether to point out that the release is non-production ready"
      },
      {
        "displayName": "Target Commitish",
        "name": "target_commitish",
        "type": "string",
        "default": "",
        "description": "Specifies the commitish value that determines where the Git tag is created from. Can be any branch or commit SHA. Unused if the Git tag already exists. Default: the repository's default branch(usually master)."
      }
    ]
  },
  {
    "displayName": "Release ID",
    "name": "release_id",
    "type": "string",
    "default": "",
    "required": true,
    "displayOptions": {
      "show": {
        "resource": [
          "release"
        ],
        "operation": [
          "get",
          "delete",
          "update"
        ]
      }
    }
  },
  {
    "displayName": "Additional Fields",
    "name": "additionalFields",
    "type": "collection",
    "typeOptions": {
      "multipleValueButtonText": "Add Field"
    },
    "displayOptions": {
      "show": {
        "operation": [
          "update"
        ],
        "resource": [
          "release"
        ]
      }
    },
    "default": {},
    "options": [
      {
        "displayName": "Body",
        "name": "body",
        "type": "string",
        "typeOptions": {
          "rows": 5
        },
        "default": "",
        "description": "The body of the release"
      },
      {
        "displayName": "Draft",
        "name": "draft",
        "type": "boolean",
        "default": false,
        "description": "Whether to create a draft (unpublished) release, \"false\" to create a published one"
      },
      {
        "displayName": "Name",
        "name": "name",
        "type": "string",
        "default": "",
        "description": "The name of the release"
      },
      {
        "displayName": "Prerelease",
        "name": "prerelease",
        "type": "boolean",
        "default": false,
        "description": "Whether to point out that the release is non-production ready"
      },
      {
        "displayName": "Tag Name",
        "name": "tag_name",
        "type": "string",
        "default": "",
        "description": "The name of the tag"
      },
      {
        "displayName": "Target Commitish",
        "name": "target_commitish",
        "type": "string",
        "default": "",
        "description": "Specifies the commitish value that determines where the Git tag is created from. Can be any branch or commit SHA. Unused if the Git tag already exists. Default: the repository's default branch(usually master)."
      }
    ]
  },
  {
    "displayName": "Return All",
    "name": "returnAll",
    "type": "boolean",
    "displayOptions": {
      "show": {
        "resource": [
          "release"
        ],
        "operation": [
          "getAll"
        ]
      }
    },
    "default": false,
    "description": "Whether to return all results or only up to a given limit"
  },
  {
    "displayName": "Limit",
    "name": "limit",
    "type": "number",
    "displayOptions": {
      "show": {
        "resource": [
          "release"
        ],
        "operation": [
          "getAll"
        ],
        "returnAll": [
          false
        ]
      }
    },
    "typeOptions": {
      "minValue": 1,
      "maxValue": 100
    },
    "default": 50,
    "description": "Max number of results to return"
  },
  {
    "displayName": "Return All",
    "name": "returnAll",
    "type": "boolean",
    "displayOptions": {
      "show": {
        "resource": [
          "repository"
        ],
        "operation": [
          "getIssues"
        ]
      }
    },
    "default": false,
    "description": "Whether to return all results or only up to a given limit"
  },
  {
    "displayName": "Limit",
    "name": "limit",
    "type": "number",
    "displayOptions": {
      "show": {
        "resource": [
          "repository"
        ],
        "operation": [
          "getIssues"
        ],
        "returnAll": [
          false
        ]
      }
    },
    "typeOptions": {
      "minValue": 1,
      "maxValue": 100
    },
    "default": 50,
    "description": "Max number of results to return"
  },
  {
    "displayName": "Filters",
    "name": "getRepositoryIssuesFilters",
    "type": "collection",
    "typeOptions": {
      "multipleValueButtonText": "Add Filter"
    },
    "displayOptions": {
      "show": {
        "operation": [
          "getIssues"
        ],
        "resource": [
          "repository"
        ]
      }
    },
    "default": {},
    "options": [
      {
        "displayName": "Assignee",
        "name": "assignee",
        "type": "string",
        "default": "",
        "description": "Return only issues which are assigned to a specific user"
      },
      {
        "displayName": "Creator",
        "name": "creator",
        "type": "string",
        "default": "",
        "description": "Return only issues which were created by a specific user"
      },
      {
        "displayName": "Mentioned",
        "name": "mentioned",
        "type": "string",
        "default": "",
        "description": "Return only issues in which a specific user was mentioned"
      },
      {
        "displayName": "Labels",
        "name": "labels",
        "type": "string",
        "default": "",
        "description": "Return only issues with the given labels. Multiple lables can be separated by comma."
      },
      {
        "displayName": "Updated Since",
        "name": "since",
        "type": "dateTime",
        "default": "",
        "description": "Return only issues updated at or after this time"
      },
      {
        "displayName": "State",
        "name": "state",
        "type": "options",
        "options": [
          {
            "name": "All",
            "value": "all",
            "description": "Returns issues with any state"
          },
          {
            "name": "Closed",
            "value": "closed",
            "description": "Return issues with \"closed\" state"
          },
          {
            "name": "Open",
            "value": "open",
            "description": "Return issues with \"open\" state"
          }
        ],
        "default": "open",
        "description": "The state to set"
      },
      {
        "displayName": "Sort",
        "name": "sort",
        "type": "options",
        "options": [
          {
            "name": "Created",
            "value": "created",
            "description": "Sort by created date"
          },
          {
            "name": "Updated",
            "value": "updated",
            "description": "Sort by updated date"
          },
          {
            "name": "Comments",
            "value": "comments",
            "description": "Sort by comments"
          }
        ],
        "default": "created",
        "description": "The order the issues should be returned in"
      },
      {
        "displayName": "Direction",
        "name": "direction",
        "type": "options",
        "options": [
          {
            "name": "Ascending",
            "value": "asc",
            "description": "Sort in ascending order"
          },
          {
            "name": "Descending",
            "value": "desc",
            "description": "Sort in descending order"
          }
        ],
        "default": "desc",
        "description": "The sort order"
      }
    ]
  },
  {
    "displayName": "PR Number",
    "name": "pullRequestNumber",
    "type": "number",
    "default": 0,
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "get",
          "update"
        ],
        "resource": [
          "review"
        ]
      }
    },
    "description": "The number of the pull request"
  },
  {
    "displayName": "Review ID",
    "name": "reviewId",
    "type": "string",
    "default": "",
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "get",
          "update"
        ],
        "resource": [
          "review"
        ]
      }
    },
    "description": "ID of the review"
  },
  {
    "displayName": "PR Number",
    "name": "pullRequestNumber",
    "type": "number",
    "default": 0,
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "getAll"
        ],
        "resource": [
          "review"
        ]
      }
    },
    "description": "The number of the pull request"
  },
  {
    "displayName": "Return All",
    "name": "returnAll",
    "type": "boolean",
    "displayOptions": {
      "show": {
        "resource": [
          "review"
        ],
        "operation": [
          "getAll"
        ]
      }
    },
    "default": false,
    "description": "Whether to return all results or only up to a given limit"
  },
  {
    "displayName": "Limit",
    "name": "limit",
    "type": "number",
    "displayOptions": {
      "show": {
        "resource": [
          "review"
        ],
        "operation": [
          "getAll"
        ],
        "returnAll": [
          false
        ]
      }
    },
    "typeOptions": {
      "minValue": 1,
      "maxValue": 100
    },
    "default": 50,
    "description": "Max number of results to return"
  },
  {
    "displayName": "PR Number",
    "name": "pullRequestNumber",
    "type": "number",
    "default": 0,
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "create"
        ],
        "resource": [
          "review"
        ]
      }
    },
    "description": "The number of the pull request to review"
  },
  {
    "displayName": "Event",
    "name": "event",
    "type": "options",
    "displayOptions": {
      "show": {
        "operation": [
          "create"
        ],
        "resource": [
          "review"
        ]
      }
    },
    "options": [
      {
        "name": "Approve",
        "value": "approve",
        "description": "Approve the pull request"
      },
      {
        "name": "Request Change",
        "value": "requestChanges",
        "description": "Request code changes"
      },
      {
        "name": "Comment",
        "value": "comment",
        "description": "Add a comment without approval or change requests"
      },
      {
        "name": "Pending",
        "value": "pending",
        "description": "You will need to submit the pull request review when you are ready"
      }
    ],
    "default": "approve",
    "description": "The review action you want to perform"
  },
  {
    "displayName": "Body",
    "name": "body",
    "type": "string",
    "displayOptions": {
      "show": {
        "operation": [
          "create"
        ],
        "resource": [
          "review"
        ],
        "event": [
          "requestChanges",
          "comment"
        ]
      }
    },
    "default": "",
    "description": "The body of the review (required for events Request Changes or Comment)"
  },
  {
    "displayName": "Additional Fields",
    "name": "additionalFields",
    "placeholder": "Add Field",
    "type": "collection",
    "default": {},
    "displayOptions": {
      "show": {
        "operation": [
          "create"
        ],
        "resource": [
          "review"
        ]
      }
    },
    "options": [
      {
        "displayName": "Commit ID",
        "name": "commitId",
        "type": "string",
        "default": "",
        "description": "The SHA of the commit that needs a review, if different from the latest"
      }
    ]
  },
  {
    "displayName": "Body",
    "name": "body",
    "type": "string",
    "displayOptions": {
      "show": {
        "operation": [
          "update"
        ],
        "resource": [
          "review"
        ]
      }
    },
    "default": "",
    "description": "The body of the review"
  },
  {
    "displayName": "Return All",
    "name": "returnAll",
    "type": "boolean",
    "displayOptions": {
      "show": {
        "resource": [
          "user"
        ],
        "operation": [
          "getRepositories"
        ]
      }
    },
    "default": false,
    "description": "Whether to return all results or only up to a given limit"
  },
  {
    "displayName": "Limit",
    "name": "limit",
    "type": "number",
    "displayOptions": {
      "show": {
        "resource": [
          "user"
        ],
        "operation": [
          "getRepositories"
        ],
        "returnAll": [
          false
        ]
      }
    },
    "typeOptions": {
      "minValue": 1,
      "maxValue": 100
    },
    "default": 50,
    "description": "Max number of results to return"
  },
  {
    "displayName": "Organization",
    "name": "organization",
    "type": "string",
    "default": "",
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "invite"
        ],
        "resource": [
          "user"
        ]
      }
    },
    "description": "The GitHub organization that the user is being invited to"
  },
  {
    "displayName": "Email",
    "name": "email",
    "type": "string",
    "placeholder": "name@email.com",
    "default": "",
    "required": true,
    "displayOptions": {
      "show": {
        "operation": [
          "invite"
        ],
        "resource": [
          "user"
        ]
      }
    },
    "description": "The email address of the invited user"
  },
  {
    "displayName": "Return All",
    "name": "returnAll",
    "type": "boolean",
    "displayOptions": {
      "show": {
        "resource": [
          "organization"
        ],
        "operation": [
          "getRepositories"
        ]
      }
    },
    "default": false,
    "description": "Whether to return all results or only up to a given limit"
  },
  {
    "displayName": "Limit",
    "name": "limit",
    "type": "number",
    "displayOptions": {
      "show": {
        "resource": [
          "organization"
        ],
        "operation": [
          "getRepositories"
        ],
        "returnAll": [
          false
        ]
      }
    },
    "typeOptions": {
      "minValue": 1,
      "maxValue": 100
    },
    "default": 50,
    "description": "Max number of results to return"
  }
];
