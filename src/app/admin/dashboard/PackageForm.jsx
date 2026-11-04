"use client";

import { useEffect, useState } from "react";
import TravelLoader from "@/components/TravelLoader";
import styles from "./PackageForm.module.css";

const defaultForm = {
  title: "",
  destination: "",
  category: "",
  duration: "",
  tripDate: "",
  price: "",
  originalPrice: "",
  description: "",
  images: [],
  highlights: [""],
  itinerary: [
    {
      day: 1,
      title: "",
      description: "",
    },
  ],
  inclusions: [""],
  exclusions: [""],
  featured: false,
  active: true,
};

function createEmptyForm() {
  return JSON.parse(JSON.stringify(defaultForm));
}

function normalizeForm(initialData) {
  if (!initialData) return createEmptyForm();

  return {
    ...createEmptyForm(),
    ...initialData,

    images: Array.isArray(initialData.images) ? initialData.images : [],

    highlights:
      Array.isArray(initialData.highlights) && initialData.highlights.length
        ? initialData.highlights
        : [""],

    itinerary:
      Array.isArray(initialData.itinerary) && initialData.itinerary.length
        ? initialData.itinerary.map((item, index) => ({
            day: item.day || index + 1,
            title: item.title || "",
            description: item.description || "",
          }))
        : [
            {
              day: 1,
              title: "",
              description: "",
            },
          ],

    inclusions:
      Array.isArray(initialData.inclusions) && initialData.inclusions.length
        ? initialData.inclusions
        : [""],

    exclusions:
      Array.isArray(initialData.exclusions) && initialData.exclusions.length
        ? initialData.exclusions
        : [""],
  };
}

export default function PackageForm({
  initialData = null,
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState(() => normalizeForm(initialData));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [formError, setFormError] = useState("");
  const today = new Date();
  const minimumTripDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  useEffect(() => {
    setForm(normalizeForm(initialData));
  }, [initialData]);

  function updateField(field, value) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  // ---------- Cloudinary Image Upload ----------

  async function uploadImages(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    const remaining = 10 - form.images.length;

    if (remaining <= 0) {
      setUploadError("You can upload a maximum of 10 images.");
      return;
    }

    const selectedFiles = files.slice(0, remaining);

    const invalidFile = selectedFiles.find(
      (file) => !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024,
    );

    if (invalidFile) {
      setUploadError("Please select image files smaller than 10 MB each.");
      return;
    }

    setUploadError("");
    setUploading(true);

    try {
      const signatureResponse = await fetch("/api/admin/cloudinary-signature", {
        method: "POST",
      });

      const signatureData = await signatureResponse.json();

      if (!signatureResponse.ok) {
        throw new Error(signatureData.message || "Upload authorization failed");
      }

      const uploadedImages = [];

      for (const file of selectedFiles) {
        const uploadForm = new FormData();

        uploadForm.append("file", file);
        uploadForm.append("api_key", signatureData.apiKey);
        uploadForm.append("timestamp", signatureData.timestamp);
        uploadForm.append("folder", signatureData.folder);
        uploadForm.append("signature", signatureData.signature);

        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
          {
            method: "POST",
            body: uploadForm,
          },
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message || "Image upload failed");
        }

        uploadedImages.push(result.secure_url);
      }

      setForm((previous) => ({
        ...previous,
        images: [...previous.images, ...uploadedImages],
      }));
    } catch (error) {
      setUploadError(error.message || "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(index) {
    setForm((previous) => ({
      ...previous,
      images: previous.images.filter((_, i) => i !== index),
    }));
  }

  function moveImage(index, direction) {
    setForm((previous) => {
      const images = [...previous.images];
      const target = index + direction;

      if (target < 0 || target >= images.length) {
        return previous;
      }

      [images[index], images[target]] = [images[target], images[index]];

      return {
        ...previous,
        images,
      };
    });
  }

  // ---------- Dynamic Highlights ----------

  function updateHighlight(index, value) {
    const highlights = [...form.highlights];
    highlights[index] = value;

    updateField("highlights", highlights);
  }

  function addHighlight() {
    if (form.highlights.length >= 15) return;

    updateField("highlights", [...form.highlights, ""]);
  }

  function removeHighlight(index) {
    const highlights = form.highlights.filter((_, i) => i !== index);

    updateField("highlights", highlights.length ? highlights : [""]);
  }

  // ---------- Dynamic Itinerary ----------

  function updateItinerary(index, field, value) {
    const itinerary = [...form.itinerary];

    itinerary[index] = {
      ...itinerary[index],
      [field]: value,
    };

    updateField("itinerary", itinerary);
  }

  function addItineraryDay() {
    if (form.itinerary.length >= 30) return;

    updateField("itinerary", [
      ...form.itinerary,
      {
        day: form.itinerary.length + 1,
        title: "",
        description: "",
      },
    ]);
  }

  function removeItineraryDay(index) {
    const itinerary = form.itinerary
      .filter((_, i) => i !== index)
      .map((item, i) => ({
        ...item,
        day: i + 1,
      }));

    updateField(
      "itinerary",
      itinerary.length
        ? itinerary
        : [
            {
              day: 1,
              title: "",
              description: "",
            },
          ],
    );
  }

  // ---------- Dynamic Inclusions / Exclusions ----------

  function updateListField(field, index, value) {
    const items = [...form[field]];
    items[index] = value;

    updateField(field, items);
  }

  function addListItem(field) {
    updateField(field, [...form[field], ""]);
  }

  function removeListItem(field, index) {
    const items = form[field].filter((_, i) => i !== index);

    updateField(field, items.length ? items : [""]);
  }

  // ---------- Form Submit ----------

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!form.title.trim()) {
      setFormError("Package title is required.");
      return;
    }

    if (!form.destination.trim()) {
      setFormError("Destination is required.");
      return;
    }

    if (!form.tripDate) {
      setFormError("Please select a trip date.");
      return;
    }

    if (!form.price || Number(form.price) <= 0) {
      setFormError("Please enter a valid package price.");
      return;
    }

    if (form.images.length === 0) {
      setFormError("Please upload at least one package image.");
      return;
    }

    const cleanHighlights = form.highlights
      .map((item) => item.trim())
      .filter(Boolean);

    const cleanItinerary = form.itinerary
      .filter((item) => item.title.trim() || item.description.trim())
      .map((item, index) => ({
        day: index + 1,
        title: item.title.trim(),
        description: item.description.trim(),
      }));

    const payload = {
      ...form,
      title: form.title.trim(),
      destination: form.destination.trim(),
      price: Number(form.price),
      originalPrice: form.originalPrice ? Number(form.originalPrice) : 0,

      images: form.images,

      highlights: cleanHighlights,

      itinerary: cleanItinerary,

      inclusions: form.inclusions.map((item) => item.trim()).filter(Boolean),

      exclusions: form.exclusions.map((item) => item.trim()).filter(Boolean),
    };

    setSaving(true);

    try {
      await onSubmit(payload);
    } catch (error) {
      setFormError(error.message || "Unable to save package.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {/* BASIC PACKAGE INFORMATION */}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>✦</div>
          <div>
            <span className={styles.sectionEyebrow}>PACKAGE DETAILS</span>
            <h2>Basic Information</h2>
            <p>Give your travel experience a memorable identity.</p>
          </div>
        </div>

        <div className={styles.gridTwo}>
          <div className={styles.field}>
            <label>Package Title *</label>
            <input
              value={form.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g. Royal Rajasthan Heritage Escape"
              required
            />
          </div>

          <div className={styles.field}>
            <label>Destination *</label>
            <input
              value={form.destination}
              onChange={(e) => updateField("destination", e.target.value)}
              placeholder="e.g. Jaipur, Rajasthan"
              required
            />
          </div>

          <div className={styles.field}>
            <label>Category</label>
            <select
              value={form.category}
              onChange={(e) => updateField("category", e.target.value)}
            >
              <option value="">Select category</option>
              <option value="Adventure">Adventure</option>
              <option value="Luxury">Luxury</option>
              <option value="Family">Family</option>
              <option value="Honeymoon">Honeymoon</option>
              <option value="Spiritual">Spiritual</option>
              <option value="Cultural">Cultural</option>
              <option value="Wildlife">Wildlife</option>
              <option value="Beach">Beach</option>
              <option value="Nature">Nature</option>
              <option value="Weekend">Weekend Getaway</option>
            </select>
          </div>

          <div className={styles.field}>
            <label>Duration *</label>
            <input
              value={form.duration}
              onChange={(e) => updateField("duration", e.target.value)}
              placeholder="e.g. 5 Days / 4 Nights"
              required
            />
          </div>

          <div className={styles.field}>
            <label>Trip Date *</label>
            <input
              type="date"
              min={minimumTripDate}
              value={form.tripDate}
              onChange={(e) => updateField("tripDate", e.target.value)}
              required
            />
          </div>

          <div className={styles.field}>
            <label>Price per Traveler (₹) *</label>
            <input
              type="number"
              min="1"
              value={form.price}
              onChange={(e) => updateField("price", e.target.value)}
              placeholder="e.g. 24999"
              required
            />
          </div>

          <div className={styles.field}>
            <label>Original Price (₹)</label>
            <input
              type="number"
              min="0"
              value={form.originalPrice}
              onChange={(e) => updateField("originalPrice", e.target.value)}
              placeholder="e.g. 29999"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label>Package Description *</label>
          <textarea
            rows={5}
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Describe the experience, destination, atmosphere, and what makes this journey special..."
            required
          />
        </div>
      </section>

      {/* CLOUDINARY IMAGES */}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>▧</div>
          <div>
            <span className={styles.sectionEyebrow}>VISUAL STORYTELLING</span>
            <h2>Package Gallery</h2>
            <p>
              Upload high-quality photos to showcase your destination. The first
              image will be the cover image.
            </p>
          </div>
        </div>

        <label className={styles.uploadArea}>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={uploadImages}
            disabled={uploading || form.images.length >= 10}
          />

          <div className={styles.uploadIcon}>↑</div>

          {uploading ? (
            <TravelLoader compact label="Uploading your package photos..." />
          ) : (
            <strong>Click to upload package images</strong>
          )}

          <span>
            JPG, PNG, WEBP · Maximum 10 MB per image · Up to 10 images
          </span>

          <span className={styles.uploadButton}>
            {uploading ? (
              <TravelLoader compact label="Please wait..." />
            ) : (
              "Choose Images"
            )}
          </span>
        </label>

        {uploadError && <div className={styles.error}>{uploadError}</div>}

        {form.images.length > 0 && (
          <div className={styles.imageGrid}>
            {form.images.map((image, index) => (
              <div className={styles.imageCard} key={image}>
                <img src={image} alt={`Package image ${index + 1}`} />

                {index === 0 && (
                  <span className={styles.coverBadge}>COVER IMAGE</span>
                )}

                <div className={styles.imageActions}>
                  <button
                    type="button"
                    onClick={() => moveImage(index, -1)}
                    disabled={index === 0}
                    title="Move left"
                  >
                    ←
                  </button>

                  <button
                    type="button"
                    onClick={() => moveImage(index, 1)}
                    disabled={index === form.images.length - 1}
                    title="Move right"
                  >
                    →
                  </button>

                  <button
                    type="button"
                    className={styles.removeButton}
                    onClick={() => removeImage(index)}
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.helperText}>
          Images are uploaded to Cloudinary. Removing an image here removes it
          from the package gallery; it does not delete the original file from
          Cloudinary.
        </div>
      </section>

      {/* PACKAGE HIGHLIGHTS */}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>✧</div>
          <div>
            <span className={styles.sectionEyebrow}>KEY EXPERIENCES</span>
            <h2>Package Highlights</h2>
            <p>
              Add the special experiences and reasons travelers will love this
              package.
            </p>
          </div>
        </div>

        <div className={styles.dynamicList}>
          {form.highlights.map((highlight, index) => (
            <div className={styles.dynamicRow} key={index}>
              <span className={styles.rowNumber}>
                {String(index + 1).padStart(2, "0")}
              </span>

              <input
                value={highlight}
                onChange={(e) => updateHighlight(index, e.target.value)}
                placeholder="e.g. Sunrise visit to the Taj Mahal"
              />

              <button
                type="button"
                className={styles.removeButton}
                onClick={() => removeHighlight(index)}
                aria-label="Remove highlight"
              >
                ×
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className={styles.addButton}
          onClick={addHighlight}
          disabled={form.highlights.length >= 15}
        >
          + Add Package Highlight
        </button>
      </section>

      {/* ITINERARY BUILDER */}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>◷</div>
          <div>
            <span className={styles.sectionEyebrow}>DAY-BY-DAY JOURNEY</span>
            <h2>Travel Itinerary</h2>
            <p>Create a structured daily plan for your travelers.</p>
          </div>
        </div>

        <div className={styles.itineraryList}>
          {form.itinerary.map((item, index) => (
            <div className={styles.itineraryCard} key={index}>
              <div className={styles.itineraryTop}>
                <div className={styles.dayBadge}>
                  <span>DAY</span>
                  <strong>{index + 1}</strong>
                </div>

                <div className={styles.itineraryHeading}>
                  <h3>Day {index + 1} Details</h3>
                  <p>Describe the activities and schedule.</p>
                </div>

                <button
                  type="button"
                  className={styles.removeDayButton}
                  onClick={() => removeItineraryDay(index)}
                  aria-label={`Remove day ${index + 1}`}
                >
                  Remove Day
                </button>
              </div>

              <div className={styles.field}>
                <label>Day Title *</label>
                <input
                  value={item.title}
                  onChange={(e) =>
                    updateItinerary(index, "title", e.target.value)
                  }
                  placeholder="e.g. Arrival in Jaipur & Royal Welcome"
                />
              </div>

              <div className={styles.field}>
                <label>Day Description / Activities *</label>
                <textarea
                  rows={4}
                  value={item.description}
                  onChange={(e) =>
                    updateItinerary(index, "description", e.target.value)
                  }
                  placeholder="Morning: Arrive at the destination...&#10;Afternoon: Explore local attractions...&#10;Evening: Dinner and overnight stay..."
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          className={styles.addButton}
          onClick={addItineraryDay}
          disabled={form.itinerary.length >= 30}
        >
          + Add Another Itinerary Day
        </button>
      </section>

      {/* INCLUSIONS / EXCLUSIONS */}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>✓</div>
          <div>
            <span className={styles.sectionEyebrow}>PACKAGE POLICIES</span>
            <h2>Inclusions & Exclusions</h2>
            <p>Clearly communicate what is and is not included.</p>
          </div>
        </div>

        <div className={styles.gridTwo}>
          <div>
            <h3 className={styles.listHeading}>
              <span className={styles.inclusionDot}>✓</span>
              What's Included
            </h3>

            {form.inclusions.map((item, index) => (
              <div className={styles.dynamicRow} key={index}>
                <input
                  value={item}
                  onChange={(e) =>
                    updateListField("inclusions", index, e.target.value)
                  }
                  placeholder="e.g. 4-star hotel accommodation"
                />

                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => removeListItem("inclusions", index)}
                >
                  ×
                </button>
              </div>
            ))}

            <button
              type="button"
              className={styles.smallAddButton}
              onClick={() => addListItem("inclusions")}
            >
              + Add Inclusion
            </button>
          </div>

          <div>
            <h3 className={styles.listHeading}>
              <span className={styles.exclusionDot}>×</span>
              What's Excluded
            </h3>

            {form.exclusions.map((item, index) => (
              <div className={styles.dynamicRow} key={index}>
                <input
                  value={item}
                  onChange={(e) =>
                    updateListField("exclusions", index, e.target.value)
                  }
                  placeholder="e.g. Personal expenses"
                />

                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => removeListItem("exclusions", index)}
                >
                  ×
                </button>
              </div>
            ))}

            <button
              type="button"
              className={styles.smallAddButton}
              onClick={() => addListItem("exclusions")}
            >
              + Add Exclusion
            </button>
          </div>
        </div>
      </section>

      {/* VISIBILITY */}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionIcon}>⚙</div>
          <div>
            <span className={styles.sectionEyebrow}>PUBLISH SETTINGS</span>
            <h2>Package Visibility</h2>
            <p>Control how this package appears on your website.</p>
          </div>
        </div>

        <div className={styles.toggleGrid}>
          <label className={styles.toggleCard}>
            <div>
              <strong>Featured Package</strong>
              <p>Show this package in featured sections.</p>
            </div>

            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => updateField("featured", e.target.checked)}
            />
          </label>

          <label className={styles.toggleCard}>
            <div>
              <strong>Active Package</strong>
              <p>Allow users to view and book this package.</p>
            </div>

            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => updateField("active", e.target.checked)}
            />
          </label>
        </div>
      </section>

      {formError && <div className={styles.error}>{formError}</div>}

      {/* FORM ACTIONS */}

      <div className={styles.formFooter}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={onCancel}
          disabled={saving || uploading}
        >
          Cancel
        </button>

        <button
          type="submit"
          className={styles.saveButton}
          disabled={saving || uploading}
        >
          {saving ? (
            <TravelLoader compact label="Saving package..." />
          ) : initialData ? (
            "Save Package Changes →"
          ) : (
            "Create New Package →"
          )}
        </button>
      </div>
    </form>
  );
}
