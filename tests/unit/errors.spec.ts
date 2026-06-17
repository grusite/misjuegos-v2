import { describe, expect, it } from "vitest"
import { DbError, fromPostgrestError, unwrap, unwrapNullable } from "@/services/errors"

describe("errors", () => {
  it("fromPostgrestError maps PostgrestError to DbError", () => {
    const error = fromPostgrestError({
      message: "duplicate key",
      code: "23505",
      details: "Key already exists",
      hint: null,
    })

    expect(error).toBeInstanceOf(DbError)
    expect(error.code).toBe("23505")
    expect(error.message).toBe("duplicate key")
  })

  it("unwrap returns data when there is no error", () => {
    const data = unwrap({ data: [{ id: "1" }], error: null })

    expect(data).toEqual([{ id: "1" }])
  })

  it("unwrap throws DbError when error is present", () => {
    expect(() =>
      unwrap({
        data: null,
        error: {
          message: "fail",
          code: "500",
          details: null,
          hint: null,
        },
      }),
    ).toThrow(DbError)
  })

  it("unwrapNullable returns null for PGRST116", () => {
    const data = unwrapNullable({
      data: null,
      error: {
        message: "not found",
        code: "PGRST116",
        details: null,
        hint: null,
      },
    })

    expect(data).toBeNull()
  })
})
