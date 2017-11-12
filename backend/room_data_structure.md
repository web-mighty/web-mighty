* Room list
  - Model: `Room`
  - Fields:
    - `id`
    - `title` 
    - `is_private`
    - `password`
    - `created`

* Room
  - Key: `room:{id}`
  - Value: 
    ```
    {
      "id": uuid, 
      "title": string,
      "created": datetime,
      "is_private": bool,
      "game_options": dict,
    }
    ```
