# Keepsey Backend API (Basic)

Base URL: `/api`

## Auth

| Method | Path | Auth | Body / Query | Description |
| --- | --- | --- | --- | --- |
| POST | `/auth/signup` | No | `name`, `email`, `password` | Register user |
| POST | `/auth/signin` | No | `email`, `password` | Login and get JWT |
| GET | `/auth/me` | Bearer | - | Current user profile |

## Categories

| Method | Path | Auth | Body / Query | Description |
| --- | --- | --- | --- | --- |
| POST | `/categories` | Bearer | `name` | Create category |
| GET | `/categories` | Bearer | - | List own categories |
| PATCH | `/categories/:id` | Bearer | `name` | Update category |
| DELETE | `/categories/:id` | Bearer | - | Delete category |

## Items

| Method | Path | Auth | Body / Query | Description |
| --- | --- | --- | --- | --- |
| POST | `/items` | Bearer | `title`, optional metadata | Create item manually |
| POST | `/items/from-url` | Bearer | `url`, optional `categoryId`, `listId` | Create item from Open Graph URL |
| POST | `/items/:id/image` | Bearer | multipart `image` | Upload/replace item image |
| GET | `/items` | Bearer | - | List own items |
| GET | `/items/by-category` | Bearer | query `categoryId` | List items by category |
| PATCH | `/items/:id` | Bearer | partial item fields | Update item |
| DELETE | `/items/:id` | Bearer | - | Delete item |

## Shared Lists

| Method | Path | Auth | Body / Query | Description |
| --- | --- | --- | --- | --- |
| POST | `/lists` | Bearer | `name` | Create shared list |
| POST | `/lists/:id/invite` | Bearer | `email`, optional `role` | Invite collaborator |
| GET | `/lists/:id` | Bearer | - | View shared list (owner hides claims; collaborator sees claims) |
| POST | `/lists/:id/items/:itemId/claim` | Bearer | optional `note` | Claim item on list |
| POST | `/lists/invites/accept` | Bearer | query `token` | Accept invite token |

## Middleware Notes

- Request validation: Zod schemas on auth/list/item routes
- Rate limits:
  - Auth: `POST /auth/signup`, `POST /auth/signin`
  - Invites: `POST /lists/:id/invite`, `POST /lists/invites/accept`

## Error Response Format

All API errors return a consistent JSON shape:

```json
{
  "error": "Human-readable message"
}
```

Common status codes used in this API:

- `400` Bad Request (validation/input errors)
- `401` Unauthorized (missing/invalid auth)
- `403` Forbidden (access denied)
- `404` Not Found
- `409` Conflict (duplicate/invite state conflicts)
- `429` Too Many Requests (rate limited)
- `500` Internal Server Error
