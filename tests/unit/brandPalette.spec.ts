import { mount } from "@vue/test-utils"
import { createPinia, setActivePinia } from "pinia"
import { beforeEach, describe, expect, it } from "vitest"
import BrandPalette from "@/components/ui/BrandPalette.vue"

describe("BrandPalette.vue", () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it("renders all brand color swatches", () => {
    const wrapper = mount(BrandPalette)

    expect(wrapper.text()).toContain("dark")
    expect(wrapper.text()).toContain("#facc15")
    expect(wrapper.text()).toContain("#f25f4c")
    expect(wrapper.text()).toContain("#e53170")
    expect(wrapper.findAll('[aria-label]')).toHaveLength(4)
  })
})
