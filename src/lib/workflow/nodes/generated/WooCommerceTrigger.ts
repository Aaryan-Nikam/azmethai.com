/**
 * GENERATED FILE - DO NOT EDIT
 * Source: /Users/aaryannikam/nocobase/clone/node_modules/n8n-nodes-base/dist/nodes/WooCommerce/WooCommerceTrigger.node.js
 */
import { AzmethNodeProperty } from '../../types';

export const WooCommerceTriggerProperties: AzmethNodeProperty[] = [
  {
    "displayName": "Event",
    "name": "event",
    "type": "options",
    "required": true,
    "default": "",
    "options": [
      {
        "name": "coupon.created",
        "value": "coupon.created"
      },
      {
        "name": "coupon.deleted",
        "value": "coupon.deleted"
      },
      {
        "name": "coupon.updated",
        "value": "coupon.updated"
      },
      {
        "name": "customer.created",
        "value": "customer.created"
      },
      {
        "name": "customer.deleted",
        "value": "customer.deleted"
      },
      {
        "name": "customer.updated",
        "value": "customer.updated"
      },
      {
        "name": "order.created",
        "value": "order.created"
      },
      {
        "name": "order.deleted",
        "value": "order.deleted"
      },
      {
        "name": "order.updated",
        "value": "order.updated"
      },
      {
        "name": "product.created",
        "value": "product.created"
      },
      {
        "name": "product.deleted",
        "value": "product.deleted"
      },
      {
        "name": "product.updated",
        "value": "product.updated"
      }
    ],
    "description": "Determines which resource events the webhook is triggered for"
  }
];
