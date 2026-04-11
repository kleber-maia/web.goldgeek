"use client";

import React, { useState, FormEvent } from "react";
import { createAppraisalRequest } from "@/lib/actions/kit.actions";
import { useRouter } from "next/navigation";
import { setPendingEmail, setPendingMagicLink } from "@/lib/account";

interface FormData {
  items: string[];
  description: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
}

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

const itemOptions = [
  "Fine Jewelry",
  "Watches & Pocket Watches",
  "Diamonds",
  "Sterling Silver",
  "Flatware & Hollowware",
  "Coins & Bullion",
  "Paper Money v Scrap Metals",
  "Other Rarities",
];

const TOTAL_STEPS = 4;

export default function RequestAppraisalPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    items: [],
    description: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [magicLinkUrl, setMagicLinkUrl] = useState<string | null>(null);

  const handleCheckboxChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.includes(value)
        ? prev.items.filter((item) => item !== value)
        : [...prev.items, value],
    }));
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getIndicatorState = (stepId: number) => {
    if (stepId < currentStep) return "completed";
    if (stepId === currentStep) return "active";
    return "inactive";
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage(null);
    const customerEmail = formData.email;

    try {
      const result = await createAppraisalRequest({
        kitType: "DIGITAL",
        estimatedValue: undefined,
        notes: `Items: ${formData.items.join(", ")}\n\nDescription: ${formData.description}`,
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
        },
        shippingAddress: {
          type: "shipping",
          street1: formData.address,
          street2: formData.address2 || undefined,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zip,
          country: "US",
          isDefault: true,
        },
      });

      if (result.success) {
        setSubmitMessage({
          type: "success",
          text: "Thank you! Your appraisal request has been submitted. Check your email for a login link to track your request.",
        });
        setMagicLinkUrl(result.data?.magicLinkUrl || null);
        setPendingEmail(customerEmail);
        if (result.data?.magicLinkUrl) {
          setPendingMagicLink(result.data.magicLinkUrl);
        }
        router.push(
          `/account/check-email?email=${encodeURIComponent(customerEmail)}&source=appraisal`
        );
      } else {
        setSubmitMessage({
          type: "error",
          text: result.error || "Something went wrong. Please try again or contact us directly.",
        });
        setMagicLinkUrl(null);
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setSubmitMessage({
        type: "error",
        text: "Something went wrong. Please try again or contact us directly.",
      });
      setMagicLinkUrl(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      data-elementor-type="wp-page"
      data-elementor-id="98"
      className="elementor elementor-98"
      data-elementor-post-type="page"
    >
      {/* Hero Section */}
      <div
        className="elementor-element elementor-element-3b0ef4a e-flex e-con-boxed e-con e-parent e-lazyloaded"
        data-id="3b0ef4a"
        data-element_type="container"
        data-settings='{"background_background":"classic"}'
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-fcee635 elementor-widget elementor-widget-heading"
            data-id="fcee635"
            data-element_type="widget"
            data-widget_type="heading.default"
          >
            <div className="elementor-widget-container">
              <h2 className="elementor-heading-title elementor-size-default">
                request appraisal
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div
        className="elementor-element elementor-element-d16f2b7 e-flex e-con-boxed e-con e-parent"
        data-id="d16f2b7"
        data-element_type="container"
      >
        <div className="e-con-inner">
          <div
            className="elementor-element elementor-element-7914dc9 e-con-full e-flex e-con e-child"
            data-id="7914dc9"
            data-element_type="container"
          >
            <div
              className="elementor-element elementor-element-7e82288 elementor-button-align-stretch elementor-widget elementor-widget-form"
              data-id="7e82288"
              data-element_type="widget"
              data-settings='{"step_next_label":"Next","step_previous_label":"Previous","button_width":"100","step_type":"number_text","step_icon_shape":"circle"}'
              data-widget_type="form.default"
            >
              <div className="elementor-widget-container">
                <form
                  className="elementor-form"
                  onSubmit={handleSubmit}
                  name="RequestAppraisal"
                  aria-label="RequestAppraisal"
                >
                  {/* Step Indicators */}
                  <div className="e-form__indicators e-form__indicators--type-number">
                    {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map(
                      (stepNum, index) => (
                        <React.Fragment key={stepNum}>
                          <div
                            className={`e-form__indicators__indicator e-form__indicators__indicator--state-${getIndicatorState(stepNum)}`}
                          >
                            <div className="e-form__indicators__indicator__number e-form__indicators__indicator--shape-circle">
                              {stepNum}
                            </div>
                          </div>
                          {index < TOTAL_STEPS - 1 && (
                            <div className="e-form__indicators__indicator__separator" />
                          )}
                        </React.Fragment>
                      )
                    )}
                  </div>

                  <div className="elementor-form-fields-wrapper elementor-labels-above">
                    {/* Step 1 - Items */}
                    <div
                      className={`e-form__step ${currentStep !== 1 ? "elementor-hidden" : ""}`}
                    >
                      <div className="elementor-field-type-checkbox elementor-field-group elementor-column elementor-field-group-item elementor-col-100">
                        <label
                          htmlFor="form-field-item"
                          className="elementor-field-label"
                        >
                          What item(s) are you looking for an offer on?
                        </label>
                        <div className="elementor-field-subgroup">
                          {itemOptions.map((item, index) => (
                            <span key={item} className="elementor-field-option">
                              <input
                                type="checkbox"
                                value={item}
                                id={`form-field-item-${index}`}
                                name="items"
                                checked={formData.items.includes(item)}
                                onChange={() => handleCheckboxChange(item)}
                              />
                              <label
                                htmlFor={`form-field-item-${index}`}
                                style={{ marginLeft: "8px" }}
                              >
                                {item}
                              </label>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Step 2 - Description */}
                    <div
                      className={`e-form__step ${currentStep !== 2 ? "elementor-hidden" : ""}`}
                    >
                      <div className="elementor-field-type-textarea elementor-field-group elementor-column elementor-field-group-field_3bbaa9a elementor-col-100">
                        <label
                          htmlFor="form-field-description"
                          className="elementor-field-label"
                        >
                          How would you describe your items?
                        </label>
                        <textarea
                          className="elementor-field-textual elementor-field elementor-size-sm"
                          name="description"
                          id="form-field-description"
                          rows={4}
                          placeholder="Tell us about your items"
                          value={formData.description}
                          onChange={handleInputChange}
                        ></textarea>
                      </div>
                    </div>

                    {/* Step 3 - Contact Info */}
                    <div
                      className={`e-form__step ${currentStep !== 3 ? "elementor-hidden" : ""}`}
                    >
                      {/* First Name */}
                      <div className="elementor-field-type-text elementor-field-group elementor-column elementor-field-group-field_859aa3c elementor-col-50 elementor-field-required elementor-mark-required">
                        <label
                          htmlFor="form-field-firstName"
                          className="elementor-field-label"
                        >
                          First Name
                        </label>
                        <input
                          size={1}
                          type="text"
                          name="firstName"
                          id="form-field-firstName"
                          className="elementor-field elementor-size-sm elementor-field-textual"
                          placeholder="First Name"
                          required
                          value={formData.firstName}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* Last Name */}
                      <div className="elementor-field-type-text elementor-field-group elementor-column elementor-field-group-last_name elementor-col-50 elementor-field-required elementor-mark-required">
                        <label
                          htmlFor="form-field-lastName"
                          className="elementor-field-label"
                        >
                          Last Name
                        </label>
                        <input
                          size={1}
                          type="text"
                          name="lastName"
                          id="form-field-lastName"
                          className="elementor-field elementor-size-sm elementor-field-textual"
                          placeholder="Last Name"
                          required
                          value={formData.lastName}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* Email */}
                      <div className="elementor-field-type-email elementor-field-group elementor-column elementor-field-group-email elementor-col-100 elementor-field-required elementor-mark-required">
                        <label
                          htmlFor="form-field-email"
                          className="elementor-field-label"
                        >
                          E-mail
                        </label>
                        <input
                          size={1}
                          type="email"
                          name="email"
                          id="form-field-email"
                          className="elementor-field elementor-size-sm elementor-field-textual"
                          placeholder="E-mail"
                          required
                          value={formData.email}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* Phone */}
                      <div className="elementor-field-type-tel elementor-field-group elementor-column elementor-field-group-Phone elementor-col-100 elementor-field-required elementor-mark-required">
                        <label
                          htmlFor="form-field-phone"
                          className="elementor-field-label"
                        >
                          Phone
                        </label>
                        <input
                          size={1}
                          type="tel"
                          name="phone"
                          id="form-field-phone"
                          className="elementor-field elementor-size-sm elementor-field-textual"
                          placeholder="Phone"
                          required
                          pattern="[0-9()#&+*\-=.]+"
                          title="Only numbers and phone characters (#, -, *, etc) are accepted."
                          value={formData.phone}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    {/* Step 4 - Address */}
                    <div
                      className={`e-form__step ${currentStep !== 4 ? "elementor-hidden" : ""}`}
                    >
                      {/* Address */}
                      <div className="elementor-field-type-text elementor-field-group elementor-column elementor-field-group-Address elementor-col-100 elementor-field-required elementor-mark-required">
                        <label
                          htmlFor="form-field-address"
                          className="elementor-field-label"
                        >
                          Address
                        </label>
                        <input
                          size={1}
                          type="text"
                          name="address"
                          id="form-field-address"
                          className="elementor-field elementor-size-sm elementor-field-textual"
                          placeholder="Address"
                          required
                          value={formData.address}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* Address Line 2 */}
                      <div className="elementor-field-type-text elementor-field-group elementor-column elementor-field-group-Address2 elementor-col-100">
                        <label
                          htmlFor="form-field-address2"
                          className="elementor-field-label"
                        >
                          Address Line 2
                        </label>
                        <input
                          size={1}
                          type="text"
                          name="address2"
                          id="form-field-address2"
                          className="elementor-field elementor-size-sm elementor-field-textual"
                          placeholder="Address Line 2"
                          value={formData.address2}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* City */}
                      <div className="elementor-field-type-text elementor-field-group elementor-column elementor-field-group-City elementor-col-33">
                        <label
                          htmlFor="form-field-city"
                          className="elementor-field-label"
                        >
                          City
                        </label>
                        <input
                          size={1}
                          type="text"
                          name="city"
                          id="form-field-city"
                          className="elementor-field elementor-size-sm elementor-field-textual"
                          placeholder="City"
                          value={formData.city}
                          onChange={handleInputChange}
                        />
                      </div>

                      {/* State */}
                      <div className="elementor-field-type-select elementor-field-group elementor-column elementor-field-group-State elementor-col-33">
                        <label
                          htmlFor="form-field-state"
                          className="elementor-field-label"
                        >
                          State
                        </label>
                        <select
                          name="state"
                          id="form-field-state"
                          className="elementor-field elementor-size-sm"
                          value={formData.state}
                          onChange={handleInputChange}
                        >
                          <option value="">--</option>
                          {US_STATES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>

                      {/* ZIP Code */}
                      <div className="elementor-field-type-text elementor-field-group elementor-column elementor-field-group-zip elementor-col-33 elementor-field-required elementor-mark-required">
                        <label
                          htmlFor="form-field-zip"
                          className="elementor-field-label"
                        >
                          ZIP Code
                        </label>
                        <input
                          size={1}
                          type="text"
                          name="zip"
                          id="form-field-zip"
                          className="elementor-field elementor-size-sm elementor-field-textual"
                          placeholder="ZIP Code"
                          required
                          value={formData.zip}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="elementor-field-group elementor-column elementor-field-type-submit elementor-col-100 e-form__buttons">
                      <div className="e-form__buttons__wrapper">
                        {currentStep > 1 && (
                          <button
                            type="button"
                            className="elementor-button elementor-size-sm e-form__buttons__wrapper__button-previous"
                            onClick={prevStep}
                          >
                            <span className="elementor-button-content-wrapper">
                              <span className="elementor-button-text">
                                Previous
                              </span>
                            </span>
                          </button>
                        )}
                        {currentStep < 4 ? (
                          <button
                            type="button"
                            className="elementor-button elementor-size-sm e-form__buttons__wrapper__button-next"
                            onClick={nextStep}
                          >
                            <span className="elementor-button-content-wrapper">
                              <span className="elementor-button-text">
                                Next
                              </span>
                            </span>
                          </button>
                        ) : (
                          <button
                            className="elementor-button elementor-size-sm"
                            type="submit"
                            disabled={isSubmitting}
                          >
                            <span className="elementor-button-content-wrapper">
                              <span className="elementor-button-text">
                                {isSubmitting ? "Sending..." : "Send"}
                              </span>
                            </span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Success/Error Message */}
                    {submitMessage && (
                      <div
                        className={`elementor-field-group elementor-column elementor-col-100 elementor-message ${
                          submitMessage.type === "success"
                            ? "elementor-message-success"
                            : "elementor-message-danger"
                        }`}
                        style={{
                          padding: "15px",
                          borderRadius: "4px",
                          marginTop: "10px",
                          backgroundColor:
                            submitMessage.type === "success"
                              ? "#d4edda"
                              : "#f8d7da",
                          color:
                            submitMessage.type === "success"
                              ? "#155724"
                              : "#721c24",
                          border: `1px solid ${
                            submitMessage.type === "success"
                              ? "#c3e6cb"
                              : "#f5c6cb"
                          }`,
                        }}
                      >
                        {submitMessage.text}
                      </div>
                    )}
                    {submitMessage?.type === "success" && magicLinkUrl && (
                      <div
                        className="elementor-field-group elementor-column elementor-col-100"
                        style={{
                          marginTop: "10px",
                          padding: "12px 16px",
                          backgroundColor: "#e0f2fe",
                          borderRadius: "4px",
                          border: "1px solid #bae6fd",
                          color: "#0c4a6e",
                        }}
                      >
                        <strong>Dev Only:</strong>{" "}
                        <a
                          href={magicLinkUrl}
                          style={{ color: "#0c4a6e", textDecoration: "underline" }}
                        >
                          Click here to sign in
                        </a>
                      </div>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
