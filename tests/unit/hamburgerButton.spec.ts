import { mount } from "@vue/test-utils"
import { describe, expect, it } from "vitest"
import HamburgerButton from "@/components/layout/HamburgerButton.vue"

describe("HamburgerButton", () => {
  it("renders three bars", () => {
    const wrapper = mount(HamburgerButton, {
      props: { open: false },
    })

    expect(wrapper.findAll(".hamburger div")).toHaveLength(3)
  })

  it("applies open class when open", () => {
    const wrapper = mount(HamburgerButton, {
      props: { open: true },
    })

    expect(wrapper.find(".hamburger").classes()).toContain("open")
  })
})
