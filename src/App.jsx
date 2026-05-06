import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { isSupabaseConfigured, supabase } from "./supabase";

const initialUploadForm = {
  password: "",
  title: "",
  modelName: "",
  prompt: "",
  imageInput: "",
};

const initialModelForm = {
  modelName: "",
};

const MODEL_ICONS = {
  chatgpt: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
  openai: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
  Gemini:
    "https://www.gstatic.com/lamda/images/favicon_v1_150160d13f7000185966.png",
  google: "https://www.gstatic.com/lamda/images/favicon_v1_150160d13f7000185966.png",
  midjourney:
    "https://upload.wikimedia.org/wikipedia/commons/e/e6/Midjourney_Emblem.svg",
  "dall-e":
    "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
  dalle: "https://upload.wikimedia.org/wikipedia/commons/0/04/ChatGPT_logo.svg",
  claude:
    "https://upload.wikimedia.org/wikipedia/commons/8/84/Claude_AI_Symbol.svg",
  grok: "https://upload.wikimedia.org/wikipedia/commons/5/54/X_logo_2023_original.svg",
};

const Icons = {
  Home: () => (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ),
  Search: () => (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle
        cx="11"
        cy="11"
        fill="none"
        r="6.5"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M16 16 20 20"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  ),
  Upload: () => (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M12 4v11"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="m7.5 8.5 4.5-4.5 4.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M5 19.5h14"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  ),
  Models: () => (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M12 4 4.5 8 12 12l7.5-4z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 12 12 16l7.5-4"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="M4.5 16 12 20l7.5-4"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  ),
};

function App() {
  const [page, setPage] = useState("home");
  const [homeModelFilter, setHomeModelFilter] = useState("All");
  const [prompts, setPrompts] = useState([]);
  const [images, setImages] = useState([]);
  const [models, setModels] = useState([]);
  const [uploadForm, setUploadForm] = useState(initialUploadForm);
  const [modelForm, setModelForm] = useState(initialModelForm);
  const [uploadAccess, setUploadAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modelSubmitting, setModelSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [copiedPromptId, setCopiedPromptId] = useState(null);
  const [activeSlides, setActiveSlides] = useState({});
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let ignore = false;

    const loadData = async () => {
      if (!isSupabaseConfigured || !supabase) {
        setErrorMessage(
          "Supabase credentials are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.",
        );
        return;
      }

      setLoading(true);
      setErrorMessage("");

      const [{ data: promptRows, error: promptError }, { data: imageRows, error: imageError }] =
        await Promise.all([
          supabase.from("prompts").select("*").order("id", { ascending: false }),
          supabase.from("images").select("*").order("id", { ascending: true }),
        ]);

      const modelResult = await supabase
        .from("models")
        .select("*")
        .order("name", { ascending: true });

      if (ignore) {
        return;
      }

      if (promptError || imageError) {
        const message =
          promptError?.message ||
          imageError?.message ||
          "We could not load data from Supabase.";

        setErrorMessage(`${message} Check your Supabase URL, anon key, and table policies.`);
        setPrompts([]);
        setImages([]);
      } else {
        setPrompts(promptRows || []);
        setImages(imageRows || []);
      }

      if (!modelResult.error) {
        setModels(modelResult.data || []);
      } else {
        setModels([]);
      }

      setLoading(false);
    };

    void loadData();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!copiedPromptId) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCopiedPromptId(null);
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [copiedPromptId]);

  const resetUploadForm = () => {
    setUploadForm(initialUploadForm);
    setUploadAccess(false);
  };

  const requireSupabase = () => {
    if (isSupabaseConfigured && supabase) {
      return true;
    }

    setErrorMessage(
      "Supabase credentials are missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.",
    );
    return false;
  };

  const handleUploadFieldChange = (field) => (event) => {
    setUploadForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleModelFieldChange = (event) => {
    setModelForm({
      modelName: event.target.value,
    });
  };

  const handlePasswordCheck = async () => {
    if (!requireSupabase()) {
      return;
    }

    const enteredPassword = uploadForm.password.trim();

    if (!enteredPassword) {
      setErrorMessage("Enter the admin password first.");
      return;
    }

    setErrorMessage("");
    setStatusMessage("");

    let { data, error } = await supabase
      .from("settings")
      .select("admin_password")
      .eq("id", 1)
      .maybeSingle();

    if (!error && !data) {
      const fallbackResult = await supabase
        .from("settings")
        .select("admin_password")
        .limit(1)
        .maybeSingle();

      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      setErrorMessage(
        `${error.message} If RLS is enabled, allow the anon role to read the settings table.`,
      );
      return;
    }

    if (!data?.admin_password) {
      setErrorMessage("No admin password was found in the settings table.");
      return;
    }

    if (enteredPassword !== String(data.admin_password).trim()) {
      setErrorMessage("Wrong password.");
      return;
    }

    setUploadAccess(true);
  };

  const handleSubmit = async () => {
    if (!requireSupabase()) {
      return;
    }

    const trimmedTitle = uploadForm.title.trim();
    const trimmedModelName = uploadForm.modelName.trim();
    const trimmedPrompt = uploadForm.prompt.trim();
    const imageUrls = uploadForm.imageInput
      .split(/\r?\n|,/)
      .map((url) => url.trim())
      .filter(Boolean);

    if (!trimmedTitle) {
      setErrorMessage("Enter a prompt title before submitting.");
      return;
    }

    if (!trimmedModelName) {
      setErrorMessage("Enter a model name before submitting.");
      return;
    }

    if (!trimmedPrompt) {
      setErrorMessage("Enter a prompt before submitting.");
      return;
    }

    if (imageUrls.length === 0) {
      setErrorMessage("Add at least one image URL.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    setStatusMessage("");

    const { data: newPrompt, error: promptError } = await supabase
      .from("prompts")
      .insert([{ title: trimmedTitle, model_name: trimmedModelName, prompt: trimmedPrompt }])
      .select()
      .single();

    if (promptError || !newPrompt) {
      setSubmitting(false);
      setErrorMessage(promptError?.message || "We could not save the prompt.");
      return;
    }

    const imageRows = imageUrls.map((imageUrl) => ({
      prompt_id: newPrompt.id,
      image_url: imageUrl,
    }));

    const { error: imageError } = await supabase.from("images").insert(imageRows);

    if (imageError) {
      setSubmitting(false);
      setErrorMessage(imageError.message);
      return;
    }

    setPrompts((current) => [newPrompt, ...current]);
    setImages((current) => [
      ...imageRows.map((row, index) => ({
        id: `${newPrompt.id}-${index}`,
        ...row,
      })),
      ...current,
    ]);

    if (
      trimmedModelName &&
      !models.some(
        (modelRow) => modelRow.name?.trim().toLowerCase() === trimmedModelName.toLowerCase(),
      )
    ) {
      const modelInsert = await supabase
        .from("models")
        .insert([{ name: trimmedModelName }])
        .select()
        .maybeSingle();

      if (!modelInsert.error && modelInsert.data) {
        setModels((current) => [...current, modelInsert.data].sort((a, b) => a.name.localeCompare(b.name)));
      }
    }

    setStatusMessage("Prompt and images added successfully.");
    setSubmitting(false);
    setPage("home");
    setSearchTerm("");
    resetUploadForm();
  };

  const handleModelSubmit = async () => {
    if (!requireSupabase()) {
      return;
    }

    const trimmedModelName = modelForm.modelName.trim();

    if (!trimmedModelName) {
      setErrorMessage("Enter a model name before saving.");
      return;
    }

    if (
      models.some((modelRow) => modelRow.name?.trim().toLowerCase() === trimmedModelName.toLowerCase())
    ) {
      setErrorMessage("That model already exists.");
      return;
    }

    setModelSubmitting(true);
    setErrorMessage("");
    setStatusMessage("");

    const { data, error } = await supabase
      .from("models")
      .insert([{ name: trimmedModelName }])
      .select()
      .single();

    if (error || !data) {
      setModelSubmitting(false);
      setErrorMessage(
        `${error?.message || "We could not save the model."} Create the models table if it does not exist.`,
      );
      return;
    }

    setModels((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)));
    setModelForm(initialModelForm);
    setModelSubmitting(false);
    setStatusMessage("Model added successfully.");
  };

  const mergedPrompts = useMemo(
    () =>
      prompts.map((promptRow) => ({
        ...promptRow,
        images: images.filter((image) => image.prompt_id === promptRow.id),
      })),
    [prompts, images],
  );

  const modelFilters = useMemo(() => {
    const promptModels = mergedPrompts.map((promptRow) => promptRow.model_name?.trim()).filter(Boolean);
    const savedModels = models.map((modelRow) => modelRow.name?.trim()).filter(Boolean);
    const uniqueModels = Array.from(new Set([...savedModels, ...promptModels])).sort((a, b) =>
      a.localeCompare(b),
    );

    return ["All", ...uniqueModels];
  }, [mergedPrompts, models]);

  const homeFeedPrompts = useMemo(() => {
    if (homeModelFilter === "All") {
      return mergedPrompts;
    }

    return mergedPrompts.filter(
      (promptRow) => (promptRow.model_name?.trim() || "Unknown model") === homeModelFilter,
    );
  }, [mergedPrompts, homeModelFilter]);

  const searchResults = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return mergedPrompts;
    }

    return mergedPrompts.filter((promptRow) => {
      const promptText = promptRow.prompt.toLowerCase();
      const titleText = (promptRow.title || "").toLowerCase();
      const modelText = (promptRow.model_name || "").toLowerCase();
      const idText = String(promptRow.id);

      return (
        promptText.includes(normalizedSearch) ||
        titleText.includes(normalizedSearch) ||
        modelText.includes(normalizedSearch) ||
        idText.includes(normalizedSearch)
      );
    });
  }, [mergedPrompts, searchTerm]);

  const copyPrompt = async (promptText, promptId) => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedPromptId(promptId);
    } catch {
      setErrorMessage("Unable to copy the prompt on this device.");
    }
  };

  const handleCarouselScroll = (event, promptId) => {
    const { scrollLeft, clientWidth } = event.currentTarget;
    const nextIndex = Math.round(scrollLeft / clientWidth);

    setActiveSlides((current) => {
      if (current[promptId] === nextIndex) {
        return current;
      }

      return {
        ...current,
        [promptId]: nextIndex,
      };
    });
  };

  const getPromptMeta = (promptRow) => {
    const label = promptRow.title?.trim() || `Prompt ${promptRow.id}`;
    const modelName = promptRow.model_name?.trim() || "Unknown model";
    const stamp = promptRow.created_at
      ? new Date(promptRow.created_at).toLocaleDateString()
      : "Recently generated";

    return { label, modelName, stamp };
  };

  const getModelIcon = (modelName) => {
    const normalizedModel = modelName.toLowerCase();
    const matchedKey = Object.keys(MODEL_ICONS).find((key) => normalizedModel.includes(key));
    return matchedKey ? MODEL_ICONS[matchedKey] : null;
  };

  const handleNavigation = (nextPage) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderFeedCard = (promptRow) => {
    const currentSlide = activeSlides[promptRow.id] || 0;
    const { label, modelName, stamp } = getPromptMeta(promptRow);
    const modelIcon = getModelIcon(modelName);

    return (
      <article className="pv-post-card" id={`prompt-${promptRow.id}`} key={promptRow.id}>
        <div className="pv-post-head">
          <div className="pv-post-user">
            <span className="pv-avatar">
              {modelIcon ? (
                <img alt={modelName} className="pv-model-icon" src={modelIcon} />
              ) : (
                <span className="pv-avatar-fallback">{modelName.slice(0, 1).toUpperCase()}</span>
              )}
            </span>
            <div>
              <p className="pv-post-title">{label}</p>
              <p className="pv-post-subtitle">{`${modelName} • ${stamp}`}</p>
            </div>
          </div>

          <button
            className="pv-copy-trigger"
            onClick={() => copyPrompt(promptRow.prompt, promptRow.id)}
            type="button"
          >
            Copy
          </button>
        </div>

        {promptRow.images.length > 0 ? (
          <div className="pv-image-frame">
            <div className="pv-carousel" onScroll={(event) => handleCarouselScroll(event, promptRow.id)}>
              {promptRow.images.map((image) => (
                <div className="pv-carousel-item" key={image.id}>
                  <img alt={label} className="pv-main-image" src={image.image_url} />
                </div>
              ))}
            </div>

            {promptRow.images.length > 1 && (
              <div className="pv-dots">
                {promptRow.images.map((image, index) => (
                  <span
                    className={`pv-dot ${index === currentSlide ? "active" : ""}`}
                    key={image.id}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="pv-image-empty">No images attached to this prompt yet.</div>
        )}

        <div className="pv-post-actions" aria-hidden="true">
          <span>♡</span>
          <span>◌</span>
          <span>➤</span>
          <span className="pv-bookmark">⌑</span>
        </div>

        <div className="pv-prompt-box">
          <p>{promptRow.prompt}</p>
          <button
            className="pv-copy-small"
            onClick={() => copyPrompt(promptRow.prompt, promptRow.id)}
            type="button"
          >
            ⧉
          </button>
        </div>
      </article>
    );
  };

  return (
    <main className="pv-app">
      <div className={`pv-toast ${copiedPromptId ? "is-visible" : ""}`}>Prompt Copied</div>

      <section className="pv-shell">
        <header className="pv-header">
          <div>
            <p className="pv-brand-kicker">The Curated Gallery</p>
            <h1>PromptVibe</h1>
          </div>

          <div className="pv-header-actions" aria-hidden="true">
            <span>♡</span>
            <span>➤</span>
          </div>
        </header>

        {!isSupabaseConfigured && (
          <div className="pv-banner pv-banner-warning">
            Supabase credentials are missing. Add `VITE_SUPABASE_URL` and
            `VITE_SUPABASE_ANON_KEY` to `.env`.
          </div>
        )}

        {errorMessage && <div className="pv-banner pv-banner-error">{errorMessage}</div>}
        {statusMessage && <div className="pv-banner pv-banner-success">{statusMessage}</div>}

        {page === "home" && (
          <>
            <section className="pv-story-row" aria-label="Model filters">
              {modelFilters.length === 0 ? (
                <div className="pv-story-empty">
                  Model filters appear here once prompts are added.
                </div>
              ) : (
                modelFilters.map((modelName) => {
                  const modelIcon = getModelIcon(modelName);
                  const isActive = homeModelFilter === modelName;

                  return (
                    <button
                      className={`pv-story-card ${isActive ? "is-active" : ""}`}
                      key={modelName}
                      onClick={() => setHomeModelFilter(modelName)}
                      type="button"
                    >
                      <span className="pv-story-ring">
                        <span className="pv-story-inner">
                          {modelName === "All" ? (
                            <span className="pv-story-fallback">All</span>
                          ) : modelIcon ? (
                            <img alt={modelName} className="pv-story-model-icon" src={modelIcon} />
                          ) : (
                            <span className="pv-story-fallback">
                              {modelName.slice(0, 1).toUpperCase()}
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="pv-story-label">{modelName}</span>
                    </button>
                  );
                })
              )}
            </section>

            <section className="pv-feed">
              {loading ? (
                <div className="pv-empty">Syncing with Supabase...</div>
              ) : homeFeedPrompts.length === 0 ? (
                <div className="pv-empty">No prompts found for this model yet.</div>
              ) : (
                homeFeedPrompts.map(renderFeedCard)
              )}
            </section>
          </>
        )}

        {page === "search" && (
          <section className="pv-search-panel">
            <div className="pv-search-card">
              <div className="pv-search-top">
                <p className="pv-upload-kicker">Search Page</p>
                <h2>Find prompts fast</h2>
              </div>

              <input
                className="pv-search-input"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by title, model, prompt text or id"
                type="text"
                value={searchTerm}
              />

              <div className="pv-search-meta">
                <span>{searchTerm.trim() ? `Results for "${searchTerm}"` : "All prompts"}</span>
                <span>{loading ? "Loading..." : `${searchResults.length} found`}</span>
              </div>
            </div>

            {loading ? (
              <div className="pv-empty">Loading searchable prompts...</div>
            ) : searchResults.length === 0 ? (
              <div className="pv-empty">No prompts matched your search.</div>
            ) : (
              <div className="pv-search-grid">
                {searchResults.map((promptRow) => {
                  const { label, modelName } = getPromptMeta(promptRow);

                  return (
                    <article className="pv-search-item" key={promptRow.id}>
                      <div className="pv-search-thumb">
                        {promptRow.images[0] ? (
                          <img alt={label} src={promptRow.images[0].image_url} />
                        ) : (
                          <div className="pv-search-thumb-empty">No image</div>
                        )}
                      </div>

                      <div className="pv-search-overlay">
                        <p className="pv-search-title">{label}</p>
                        <p className="pv-search-model">{modelName}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {page === "upload" && (
          <section className="pv-upload-panel">
            <div className="pv-upload-card">
              <div className="pv-upload-top">
                <p className="pv-upload-kicker">Admin Panel</p>
                <h2>{uploadAccess ? "Create gallery post" : "Unlock upload access"}</h2>
              </div>

              {!uploadAccess ? (
                <div className="pv-form-stack">
                  <label htmlFor="password">Admin password</label>
                  <input
                    id="password"
                    onChange={handleUploadFieldChange("password")}
                    placeholder="Enter admin password"
                    type="password"
                    value={uploadForm.password}
                  />
                  <button onClick={handlePasswordCheck} type="button">
                    Continue
                  </button>
                </div>
              ) : (
                <div className="pv-form-stack">
                  <label htmlFor="title">Prompt title</label>
                  <input
                    id="title"
                    list="model-name-options"
                    onChange={handleUploadFieldChange("title")}
                    placeholder="Give this prompt a title"
                    type="text"
                    value={uploadForm.title}
                  />

                  <label htmlFor="modelName">Model name</label>
                  <input
                    id="modelName"
                    list="model-name-options"
                    onChange={handleUploadFieldChange("modelName")}
                    placeholder="ChatGPT, Midjourney, Gemini..."
                    type="text"
                    value={uploadForm.modelName}
                  />

                  <label htmlFor="prompt">Prompt text</label>
                  <textarea
                    id="prompt"
                    onChange={handleUploadFieldChange("prompt")}
                    placeholder="Write the prompt you want to publish"
                    rows="6"
                    value={uploadForm.prompt}
                  />

                  <label htmlFor="images">Image URLs</label>
                  <textarea
                    id="images"
                    onChange={handleUploadFieldChange("imageInput")}
                    placeholder={
                      "One image URL per line\nhttps://example.com/image-1.jpg\nhttps://example.com/image-2.jpg"
                    }
                    rows="5"
                    value={uploadForm.imageInput}
                  />

                  <button disabled={submitting} onClick={handleSubmit} type="button">
                    {submitting ? "Publishing..." : "Publish prompt"}
                  </button>

                  <button className="pv-secondary" onClick={resetUploadForm} type="button">
                    Exit admin
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {page === "models" && (
          <section className="pv-models-panel">
            <div className="pv-upload-card">
              <div className="pv-upload-top">
                <p className="pv-upload-kicker">Model Adder</p>
                <h2>Add a model filter</h2>
              </div>

              <div className="pv-form-stack">
                <label htmlFor="newModelName">Model name</label>
                <input
                  id="newModelName"
                  onChange={handleModelFieldChange}
                  placeholder="ChatGPT, Gemini, Midjourney..."
                  type="text"
                  value={modelForm.modelName}
                />

                <button disabled={modelSubmitting} onClick={handleModelSubmit} type="button">
                  {modelSubmitting ? "Saving..." : "Add model"}
                </button>
              </div>
            </div>

            <div className="pv-model-list">
              {modelFilters.length <= 1 ? (
                <div className="pv-empty">No models saved yet.</div>
              ) : (
                modelFilters
                  .filter((modelName) => modelName !== "All")
                  .map((modelName) => {
                    const modelIcon = getModelIcon(modelName);

                    return (
                      <div className="pv-model-chip" key={modelName}>
                        <span className="pv-model-chip-icon">
                          {modelIcon ? (
                            <img alt={modelName} className="pv-model-icon" src={modelIcon} />
                          ) : (
                            <span className="pv-avatar-fallback">
                              {modelName.slice(0, 1).toUpperCase()}
                            </span>
                          )}
                        </span>
                        <span>{modelName}</span>
                      </div>
                    );
                  })
              )}
            </div>
          </section>
        )}
      </section>

      <datalist id="model-name-options">
        {modelFilters
          .filter((modelName) => modelName !== "All")
          .map((modelName) => (
            <option key={modelName} value={modelName} />
          ))}
      </datalist>

      <nav className="pv-bottom-nav" aria-label="Page navigation">
        <button
          aria-label="Home"
          className={page === "home" ? "active" : ""}
          onClick={() => handleNavigation("home")}
          type="button"
        >
          <Icons.Home />
        </button>
        <button
          aria-label="Search"
          className={page === "search" ? "active" : ""}
          onClick={() => handleNavigation("search")}
          type="button"
        >
          <Icons.Search />
        </button>
        <button
          aria-label="Upload"
          className={page === "upload" ? "active" : ""}
          onClick={() => handleNavigation("upload")}
          type="button"
        >
          <Icons.Upload />
        </button>
        <button
          aria-label="Models"
          className={page === "models" ? "active" : ""}
          onClick={() => handleNavigation("models")}
          type="button"
        >
          <Icons.Models />
        </button>
      </nav>
    </main>
  );
}

export default App;
