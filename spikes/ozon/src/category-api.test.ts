import { expect, test } from "vitest";
import { findDescriptionCategoryMatches, mapAttributeDefinitions, selectDictionaryAttributes } from "./category-api.js";

test("keeps required and dictionary metadata", () => {
  const result = mapAttributeDefinitions({
    result: [
      {
        id: 10,
        name: "Материал",
        is_required: true,
        dictionary_id: 20,
        is_collection: true,
        type: "String",
      },
    ],
  });

  expect(result).toEqual([
    {
      id: 10,
      name: "Материал",
      required: true,
      dictionaryId: 20,
      collection: true,
      valueType: "String",
    },
  ]);
});

test("finds enabled storage ottoman product types beneath a matching category", () => {
  const matches = findDescriptionCategoryMatches(
    {
      result: [
        {
          description_category_id: 100,
          category_name: "Мебель",
          disabled: false,
          children: [
            {
              description_category_id: 200,
              category_name: "Пуфы с ящиком для хранения",
              disabled: false,
              children: [{ type_id: 300, type_name: "Пуф", disabled: false, children: [] }],
            },
          ],
        },
      ],
    },
    "пуф с ящиком для хранения",
  );

  expect(matches).toEqual([
    {
      descriptionCategoryId: 200,
      categoryName: "Пуфы с ящиком для хранения",
      typeId: 300,
      typeName: "Пуф",
    },
  ]);
});

test("selects attributes whose permitted values must be loaded from an Ozon dictionary", () => {
  expect(
    selectDictionaryAttributes([
      { id: 10, name: "Материал", required: true, dictionaryId: 20, collection: true, valueType: "String" },
      { id: 11, name: "Вес", required: true, dictionaryId: 0, collection: false, valueType: "Integer" },
    ]),
  ).toEqual([{ id: 10, name: "Материал", required: true, dictionaryId: 20, collection: true, valueType: "String" }]);
});
