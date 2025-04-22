import { getToken } from "@/lib/auth";

export interface Document {
  _id: string;
  title: string;
  content: string;
  fileUrl: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

class DocumentService {
  private baseUrl = "/api/documents";

  async getAllDocuments(): Promise<Document[]> {
    try {
      const token = getToken();
      const response = await fetch(this.baseUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }

      return response.json();
    } catch (error) {
      console.error("Error in getAllDocuments:", error);
      throw error;
    }
  }

  async uploadDocument(file: File): Promise<Document> {
    try {
      const token = getToken();
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload document");
      }

      return response.json();
    } catch (error) {
      console.error("Error in uploadDocument:", error);
      throw error;
    }
  }
}

export const documentService = new DocumentService(); 