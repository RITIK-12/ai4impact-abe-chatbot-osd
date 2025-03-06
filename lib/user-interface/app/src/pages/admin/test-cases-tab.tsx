import {
    Button,
    Container,
    FileUpload,
    Flashbar,
    FlashbarProps,
    Form,
    FormField,
    ProgressBar,
    ProgressBarProps,
    SpaceBetween,
  } from "@cloudscape-design/components";
  import { useContext, useState } from "react";
  import { AppContext } from "../../common/app-context";
  import { ApiClient } from "../../common/api-client/api-client";
  import { Utils } from "../../common/utils";
  import { FileUploader } from "../../common/file-uploader";
  import { useNavigate } from "react-router-dom";


  const fileExtensions = new Set([
    ".csv",
    ".json"
  ]);

  const mimeTypes = {
    '.csv': 'text/csv',
    '.json': 'application/json'
  };

  export interface FileUploadTabProps {
    tabChangeFunction: () => void;  
  }

  export default function DataFileUpload(props: FileUploadTabProps) {
    const appContext = useContext(AppContext);
    const apiClient = new ApiClient(appContext);
    const navigate = useNavigate();
    const [files, setFiles] = useState<File[]>([]);
    const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
    const [fileErrors, setFileErrors] = useState<string[]>([]);
    const [globalError, setGlobalError] = useState<string | undefined>(undefined);
    const [uploadError, setUploadError] = useState<string | undefined>(undefined);
    const [uploadingStatus, setUploadingStatus] =
      useState<FlashbarProps.Type>("info");
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploadingIndex, setUploadingIndex] = useState<number>(0);
    const [currentFileName, setCurrentFileName] = useState<string>("");
    const [uploadPanelDismissed, setUploadPanelDismissed] =
      useState<boolean>(false);

    const onSetFiles = (files: File[]) => {
      const errors: string[] = [];
      const filesToUpload: File[] = [];
      setUploadError(undefined);

      if (files.length > 100) {
        setUploadError("Max 100 files allowed");
        files = files.slice(0, 100);
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExtension = file.name.split(".").pop()?.toLowerCase();

        if (!fileExtensions.has(`.${fileExtension}`)) {
          errors[i] = "Format not supported";
        } else if (file.size > 1000 * 1000 * 100) {
          errors[i] = "File size is too large, max 100MB";
        } else {
          filesToUpload.push(file);
        }
      }

      setFiles(files);
      setFileErrors(errors);
      setFilesToUpload(filesToUpload);
    };

    const onUpload = async () => {
      if (!appContext) return;
      setUploadingStatus("in-progress");
      setUploadProgress(0);
      setUploadingIndex(1);
      setUploadPanelDismissed(false);

      const uploader = new FileUploader();
      const totalSize = filesToUpload.reduce((acc, file) => acc + file.size, 0);
      let accumulator = 0;
      let hasError = false;

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setCurrentFileName(file.name);
        let fileUploaded = 0;

        try {

          const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
          const fileType = mimeTypes[fileExtension];
          const result = await apiClient.evaluations.getUploadURL(file.name,fileType);
          // console.log(result);      
          try {
            await uploader.upload(
              file,
              result, //.data!.getUploadFileURL!,
              fileType,
              (uploaded: number) => {
                fileUploaded = uploaded;
                const totalUploaded = fileUploaded + accumulator;
                const percent = Math.round((totalUploaded / totalSize) * 100);
                setUploadProgress(percent);
              }
            );

            accumulator += file.size;
            setUploadingIndex(Math.min(filesToUpload.length, i + 2));
          } catch (error) {
            console.error(error);
            setUploadingStatus("error");
            hasError = true;
            break;
          }
        } catch (error: any) {
          setGlobalError(Utils.getErrorMessage(error));
          console.error(Utils.getErrorMessage(error));
          setUploadingStatus("error");
          hasError = true;
          break;
        }
      }

      if (!hasError) {
        setUploadingStatus("success");
        setFilesToUpload([]);
        setFiles([]);
        
        // Add a slight delay before redirecting to ensure the success message is seen
        setTimeout(() => {
          // Call the tabChangeFunction to update the parent component
          props.tabChangeFunction();
          // Redirect to the new-eval tab with the correct URL
          window.location.hash = "?activeTabId=new-eval";
        }, 1500);
      }
    };

    const getProgressbarStatus = (): ProgressBarProps.Status => {
      if (uploadingStatus === "error") return "error";
      if (uploadingStatus === "success") return "success";
      return "in-progress";
    };

    /*const hasReadyWorkspace =
      typeof props.data.workspace?.value !== "undefined" &&
      typeof props.selectedWorkspace !== "undefined" &&
      props.selectedWorkspace.status === "ready";*/

    return (
      <Form
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              data-testid="create"
              variant="primary"
              disabled={
                filesToUpload.length === 0 ||
                uploadingStatus === "in-progress"
                // !hasReadyWorkspace
              }
              onClick={onUpload}
            >
              Upload files
            </Button>
          </SpaceBetween>
        }
        errorText={globalError}
      >
        <SpaceBetween size="s">
        <Container header={<h3>Test Case File Format Requirements</h3>}>
            <SpaceBetween size="xxs">
            <p>Please ensure that your test case files follow one of the formats below:</p>
            
            <h4>File Formats</h4>
            <ul>
                <li>Files must be in either CSV or JSON format with the appropriate extension.</li>
                <li>Each file must contain test cases with <strong>question</strong> and <strong>expectedResponse</strong> fields.</li>
                <li>File size should not exceed 100MB.</li>
            </ul>
            
            <h4>CSV Format</h4>
            <ul>
                <li>File must be in CSV format with a .csv extension.</li>
                <li>File must include a header in the first row with the columns <strong>question</strong>, <strong>expectedResponse</strong></li>
                <li>Each subsequent row should represent a single test case, with appropriate values in each column.</li>
                <li>File size should not exceed 100MB.</li>
            </ul>
            </SpaceBetween>
        </Container>
          <Container>
            <SpaceBetween size="l">
              <FormField>
                <FileUpload
                  onChange={({ detail }) => onSetFiles(detail.value)}
                  value={files}
                  i18nStrings={{
                    uploadButtonText: (e) => (e ? "Choose files" : "Choose file"),
                    dropzoneText: (e) =>
                      e ? "Drop files to upload" : "Drop file to upload",
                    removeFileAriaLabel: (e) => `Remove file ${e + 1}`,
                    limitShowFewer: "Show fewer files",
                    limitShowMore: "Show more files",
                    errorIconAriaLabel: "Error",
                  }}
                  multiple
                  showFileLastModified
                  showFileSize
                  showFileThumbnail
                  tokenLimit={3}
                  constraintText={`Text documents up to 100MB supported (${Array.from(
                    fileExtensions.values()
                  ).join(", ")})`}
                  fileErrors={fileErrors}
                  errorText={uploadError}
                />
              </FormField>
            </SpaceBetween>
          </Container>
          {uploadingStatus !== "info" && !uploadPanelDismissed && (
            <Flashbar
              items={[
                {
                  content: (
                    <ProgressBar
                      value={uploadProgress}
                      variant="flash"
                      description={
                        uploadingStatus === "success" ||
                        uploadingStatus === "error"
                          ? null
                          : currentFileName
                      }
                      status={getProgressbarStatus()}
                      additionalInfo={
                        uploadingStatus === "in-progress"
                          ? `Uploading ${uploadingIndex} of ${filesToUpload.length}`
                          : undefined
                      }
                    />
                  ),
                  statusIconAriaLabel:
                    uploadingStatus === "success"
                      ? "success"
                      : uploadingStatus === "error"
                      ? "error"
                      : "in progress",
                  dismissible: uploadingStatus !== "in-progress",
                  dismissLabel: "Dismiss message",
                  onDismiss: () => setUploadPanelDismissed(true),
                  id: "upload_progress",
                },
              ]}
            />
          )}
        </SpaceBetween>
      </Form>
    );
  }
